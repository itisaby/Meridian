import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import NetworkGraph from '../components/NetworkGraph';

interface SimpleProject {
    id: string;
    name: string;
    [key: string]: string | number | boolean | undefined;
}

interface ProjectData {
    id: string;
    name: string;
    description: string;
    status: string;
    priority: string;
    repositories: Array<{
        repository_name: string;
        repository_url: string;
        description: string;
        technology_stack: string;
        primary_language: string;
        branch: string;
        is_primary: boolean;
    }>;
    assignments: Array<{
        user_id: string;
        repository_name: string;
        role: string;
        user: {
            id: string;
            username: string;
            email: string;
            github_avatar_url?: string;
        };
    }>;
}

interface NodeData {
    id: string;
    name?: string;
    username?: string;
    email?: string;
    [key: string]: string | number | boolean | undefined;
}

const TeamManagement = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedNodeInfo, setSelectedNodeInfo] = useState<{
        nodeId: string;
        nodeType: 'manager' | 'project' | 'member';
        data?: NodeData;
    } | null>(null);

    // Redirect if not manager
    useEffect(() => {
        if (user && user.role !== 'manager') {
            router.push('/dashboard');
        }
    }, [user, router]);

    // Fetch projects data
    const fetchProjectsData = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);

            // Fetch manager's projects with full details
            const projectsResponse = await fetch(`http://localhost:8000/projects/manager/${user.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!projectsResponse.ok) {
                throw new Error('Failed to fetch projects');
            }

            const projectsData = await projectsResponse.json();

            // Extract projects array from the response
            const projects = projectsData.projects || [];

            // Ensure projects is an array
            if (!Array.isArray(projects)) {
                console.error('Projects data is not an array:', projects);
                setProjects([]);
                setLoading(false);
                return;
            }

            // Fetch detailed information for each project
            const detailedProjects = await Promise.all(
                projects.map(async (project: SimpleProject) => {
                    try {
                        // Fetch project details
                        const projectDetailResponse = await fetch(
                            `http://localhost:8000/projects/multi-repo/${project.id}`,
                            {
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );

                        if (!projectDetailResponse.ok) {
                            console.error(`Failed to fetch details for project ${project.id}`);
                            return null;
                        }

                        const projectDetail = await projectDetailResponse.json();

                        // Fetch assignments
                        const assignmentsResponse = await fetch(
                            `http://localhost:8000/projects/${project.id}/assignments`,
                            {
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );

                        let assignments = [];
                        if (assignmentsResponse.ok) {
                            assignments = await assignmentsResponse.json();
                        }

                        return {
                            ...projectDetail,
                            assignments
                        };
                    } catch (error) {
                        console.error(`Error fetching project ${project.id}:`, error);
                        return null;
                    }
                })
            );

            // Filter out null results
            const validProjects = detailedProjects.filter(project => project !== null);
            setProjects(validProjects);

        } catch (error) {
            console.error('Error fetching projects:', error);
            setError('Failed to load team data');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchProjectsData();
    }, [fetchProjectsData]);

    const handleNodeClick = (nodeId: string, nodeType: 'manager' | 'project' | 'member', data?: NodeData) => {
        setSelectedNodeInfo({ nodeId, nodeType, data });
    };

    const handleViewProject = (projectId: string) => {
        router.push(`/edit-project/${projectId}`);
    };

    const getTeamStats = () => {
        const totalTeamMembers = new Set();
        const totalRepositories = projects.reduce((sum, project) => sum + project.repositories.length, 0);
        const totalTechnologies = new Set<string>();

        projects.forEach(project => {
            project.assignments.forEach(assignment => {
                totalTeamMembers.add(assignment.user_id);
            });
            project.repositories.forEach(repo => {
                totalTechnologies.add(repo.primary_language);
                totalTechnologies.add(repo.technology_stack);
            });
        });

        return {
            totalProjects: projects.length,
            totalTeamMembers: totalTeamMembers.size,
            totalRepositories,
            totalTechnologies: totalTechnologies.size
        };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-red-800">Error</h3>
                        <p className="text-red-600 mt-2">{error}</p>
                        <button
                            onClick={fetchProjectsData}
                            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const stats = getTeamStats();

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        🌐 Team Network Overview
                    </h1>
                    <p className="text-gray-600">
                        Interactive bird&apos;s-eye view of your team structure and project relationships
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                        <div className="text-2xl font-bold">{stats.totalProjects}</div>
                        <div className="text-sm opacity-90">Active Projects</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                        <div className="text-2xl font-bold">{stats.totalTeamMembers}</div>
                        <div className="text-sm opacity-90">Team Members</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                        <div className="text-2xl font-bold">{stats.totalRepositories}</div>
                        <div className="text-sm opacity-90">Repositories</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                        <div className="text-2xl font-bold">{stats.totalTechnologies}</div>
                        <div className="text-sm opacity-90">Technologies</div>
                    </div>
                </div>

                {/* Network Graph */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Team Network Graph
                        </h2>
                        <p className="text-sm text-gray-600">
                            Explore your organizational structure by clicking and hovering on nodes
                        </p>
                    </div>

                    {user && (
                        <NetworkGraph
                            managerId={user.id}
                            managerName={user.username}
                            projects={projects}
                            onNodeClick={handleNodeClick}
                        />
                    )}
                </div>

                {/* Selected Node Details */}
                {selectedNodeInfo && (
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            📍 Selected Node Details
                        </h3>

                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Node Information</h4>
                                    <div className="space-y-1 text-sm">
                                        <div><span className="font-medium">Type:</span> {selectedNodeInfo.nodeType}</div>
                                        <div><span className="font-medium">ID:</span> {selectedNodeInfo.nodeId}</div>
                                        {selectedNodeInfo.data?.name && (
                                            <div><span className="font-medium">Name:</span> {selectedNodeInfo.data.name}</div>
                                        )}
                                        {selectedNodeInfo.data?.username && (
                                            <div><span className="font-medium">Username:</span> {selectedNodeInfo.data.username}</div>
                                        )}
                                        {selectedNodeInfo.data?.email && (
                                            <div><span className="font-medium">Email:</span> {selectedNodeInfo.data.email}</div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                                    <div className="space-y-2">
                                        {selectedNodeInfo.nodeType === 'project' && (
                                            <button
                                                onClick={() => handleViewProject(selectedNodeInfo.nodeId.replace('project_', ''))}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                📝 Edit Project
                                            </button>
                                        )}
                                        {selectedNodeInfo.nodeType === 'member' && (
                                            <div className="text-sm text-gray-600">
                                                View team member assignments and contributions
                                            </div>
                                        )}
                                        {selectedNodeInfo.nodeType === 'manager' && (
                                            <div className="text-sm text-gray-600">
                                                You are viewing your management overview
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Team Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Project Status Overview */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            📊 Project Status Distribution
                        </h3>

                        <div className="space-y-3">
                            {['active', 'completed', 'on-hold', 'cancelled'].map(status => {
                                const count = projects.filter(p => p.status === status).length;
                                const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0;

                                return (
                                    <div key={status} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-4 h-4 rounded-full ${status === 'active' ? 'bg-green-500' :
                                                status === 'completed' ? 'bg-gray-500' :
                                                    status === 'on-hold' ? 'bg-yellow-500' : 'bg-red-500'
                                                }`}></div>
                                            <span className="capitalize text-gray-700">{status}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium">{count}</span>
                                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${status === 'active' ? 'bg-green-500' :
                                                        status === 'completed' ? 'bg-gray-500' :
                                                            status === 'on-hold' ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Technology Stack Distribution */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            🛠️ Technology Stack Usage
                        </h3>

                        <div className="space-y-3">
                            {Array.from(new Set(
                                projects.flatMap(p =>
                                    p.repositories.map(r => r.primary_language).filter(Boolean)
                                )
                            )).slice(0, 5).map(tech => {
                                const count = projects.reduce((sum, p) =>
                                    sum + p.repositories.filter(r => r.primary_language === tech).length, 0
                                );
                                const maxCount = Math.max(1, ...Array.from(new Set(
                                    projects.flatMap(p =>
                                        p.repositories.map(r => r.primary_language).filter(Boolean)
                                    )
                                )).map(t =>
                                    projects.reduce((sum, p) =>
                                        sum + p.repositories.filter(r => r.primary_language === t).length, 0
                                    )
                                ));
                                const percentage = (count / maxCount) * 100;

                                return (
                                    <div key={tech} className="flex items-center justify-between">
                                        <span className="text-gray-700">{tech}</span>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium">{count}</span>
                                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="h-2 rounded-full bg-indigo-500"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-center space-x-4">
                    <button
                        onClick={() => router.push('/manager-dashboard')}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                    <button
                        onClick={() => router.push('/create-multi-repo-project')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Create New Project
                    </button>
                    <button
                        onClick={fetchProjectsData}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                        🔄 Refresh Network
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeamManagement;

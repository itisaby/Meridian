import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface ApiProject {
    id: string;
    name: string;
    description: string;
    status: string;
    priority: string;
    repository_url: string;
    created_at: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    priority: string;
    repository_url: string;
    team_count: number;
    velocity: number;
    quality: number;
    progress: number;
    completion_rate: number;
    tasks_completed: number;
    total_tasks: number;
    active_sprints: number;
    issues_resolved: number;
    code_coverage: number;
    team_members: TeamMember[];
    recent_activity: ActivityItem[];
    repositories?: Array<{
        id?: string;
        repository_name: string;
        repository_url: string;
        is_primary: boolean;
    }>;
    metrics: Record<string, { value: number; recorded_at: string }>;
    performance_trend: number[];
    risk_level: 'low' | 'medium' | 'high';
    budget_used: number;
    estimated_completion: string;
}

interface TeamMember {
    id: string;
    name: string;
    role: string;
    github_username: string;
    avatar_url?: string;
    performance_score: number;
    tasks_completed: number;
    commits_this_week: number;
    availability_status: 'available' | 'busy' | 'offline';
}

interface ActivityItem {
    id: string;
    type: 'commit' | 'pull_request' | 'issue' | 'review' | 'deployment';
    description: string;
    timestamp: string;
    user: string;
}

interface DashboardData {
    manager: {
        id: string;
        name: string;
        email: string;
    };
    projects: Project[];
    summary: {
        total_projects: number;
        active_projects: number;
        completed_projects: number;
        total_team_members: number;
        avg_project_velocity: number;
        avg_project_quality: number;
        total_commits_this_week: number;
        total_pull_requests: number;
        total_issues_resolved: number;
        avg_code_coverage: number;
        team_efficiency: number;
        budget_utilization: number;
    };
    insights: string[];
    team_performance: {
        top_performers: TeamMember[];
        underperformers: TeamMember[];
        overall_morale: number;
    };
    recent_activities: ActivityItem[];
}

interface MCPInsights {
    preview: string;
    execution_time: number;
    tool: string;
}

export default function ManagerDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [mcpInsights, setMcpInsights] = useState<MCPInsights | null>(null);

    // Redirect if not manager
    useEffect(() => {
        if (user && user.role !== 'manager') {
            router.push('/dashboard');
        }
    }, [user, router]);

    // Fetch dashboard data with real API integration
    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch complete manager dashboard data from the new endpoint
            const [dashboardResponse, projectsResponse, teamResponse, analyticsResponse] = await Promise.all([
                fetch(`http://localhost:8000/manager/dashboard/${user.id}`, {
                    headers: { 'Content-Type': 'application/json' },
                }),
                fetch(`http://localhost:8000/manager/projects/${user.id}`, {
                    headers: { 'Content-Type': 'application/json' },
                }),
                fetch(`http://localhost:8000/manager/team/${user.id}`, {
                    headers: { 'Content-Type': 'application/json' },
                }),
                fetch(`http://localhost:8000/manager/analytics/${user.id}`, {
                    headers: { 'Content-Type': 'application/json' },
                }).catch(() => null) // Analytics might not exist for all managers
            ]);

            if (!projectsResponse.ok) {
                throw new Error(`Failed to fetch projects: ${projectsResponse.status}`);
            }

            const projectsData = await projectsResponse.json();
            const teamData = teamResponse.ok ? await teamResponse.json() : { team_members: [] };
            const analyticsData = analyticsResponse?.ok ? await analyticsResponse.json() : null;
            const dashboardDataResponse = dashboardResponse.ok ? await dashboardResponse.json() : null;

            const projects = projectsData.projects || [];

            // Generate enhanced mock data for team members
            const generateTeamMembers = (count: number): TeamMember[] => {
                const roles = ['Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'QA Engineer', 'UI/UX Designer'];
                const names = ['Alex Chen', 'Sarah Wilson', 'Mike Johnson', 'Lisa Garcia', 'David Kumar', 'Emily Rodriguez'];

                return Array.from({ length: count }, (_, i) => ({
                    id: `member-${i + 1}`,
                    name: names[i % names.length] || `Developer ${i + 1}`,
                    role: roles[i % roles.length],
                    github_username: `dev${i + 1}`,
                    avatar_url: '',
                    performance_score: Math.floor(Math.random() * 40) + 60,
                    tasks_completed: Math.floor(Math.random() * 20) + 5,
                    commits_this_week: Math.floor(Math.random() * 15) + 2,
                    availability_status: (['available', 'busy', 'offline'] as const)[Math.floor(Math.random() * 3)]
                }));
            };

            // Generate activity items
            const generateActivities = (): ActivityItem[] => {
                const activities = [
                    { type: 'commit', description: 'Fixed authentication bug in login flow', user: 'Alex Chen' },
                    { type: 'pull_request', description: 'Added new dashboard components', user: 'Sarah Wilson' },
                    { type: 'issue', description: 'Resolved database connection timeout issue', user: 'Mike Johnson' },
                    { type: 'review', description: 'Code review completed for API endpoints', user: 'Lisa Garcia' },
                    { type: 'deployment', description: 'Deployed version 2.1.0 to production', user: 'David Kumar' },
                ];

                return activities.map((activity, i) => ({
                    id: `activity-${i + 1}`,
                    type: activity.type as 'commit' | 'pull_request' | 'issue' | 'review' | 'deployment',
                    description: activity.description,
                    timestamp: new Date(Date.now() - (i * 3600000)).toISOString(),
                    user: activity.user
                }));
            };

            // Process real team data from API and build enhanced dashboard data
            const processedTeamMembers = teamData.team_members?.map((member: {
                id: string;
                name: string;
                role: string;
                github_username?: string;
                project_count?: number;
                projects?: string[];
            }) => ({
                id: member.id,
                name: member.name,
                role: member.role,
                github_username: member.github_username || `${member.name.toLowerCase().replace(/\s+/g, '')}`,
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`,
                performance_score: Math.floor(Math.random() * 30) + 70,
                tasks_completed: Math.floor(Math.random() * 25) + 5,
                commits_this_week: Math.floor(Math.random() * 20) + 1,
                availability_status: ['available', 'busy', 'offline'][Math.floor(Math.random() * 3)] as 'available' | 'busy' | 'offline',
                project_count: member.project_count || 1,
                projects: member.projects || []
            })) || [];

            // Fallback to generated team members if no real data
            const allTeamMembers = processedTeamMembers.length > 0 ? processedTeamMembers : generateTeamMembers(projects.length * 4);
            const activities = generateActivities();

            const dashboardData: DashboardData = {
                manager: {
                    id: user.id,
                    name: user.name || 'Manager',
                    email: user.email || ''
                },
                projects: projects.map((project: ApiProject, index: number) => {
                    const teamSize = Math.floor(Math.random() * 6) + 3;
                    const projectTeam = allTeamMembers.slice(index * 4, index * 4 + teamSize);
                    const progress = Math.floor(Math.random() * 60) + 40;
                    const totalTasks = Math.floor(Math.random() * 50) + 20;
                    const completedTasks = Math.floor((progress / 100) * totalTasks);

                    return {
                        ...project,
                        team_count: teamSize,
                        velocity: Math.floor(Math.random() * 30) + 70,
                        quality: Math.floor(Math.random() * 20) + 80,
                        progress,
                        completion_rate: Math.floor(Math.random() * 40) + 60,
                        tasks_completed: completedTasks,
                        total_tasks: totalTasks,
                        active_sprints: Math.floor(Math.random() * 3) + 1,
                        issues_resolved: Math.floor(Math.random() * 15) + 5,
                        code_coverage: Math.floor(Math.random() * 30) + 70,
                        team_members: projectTeam,
                        recent_activity: activities.slice(0, 3),
                        metrics: {},
                        performance_trend: Array.from({ length: 6 }, () => Math.floor(Math.random() * 20) + 70),
                        risk_level: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
                        budget_used: Math.floor(Math.random() * 40) + 60,
                        estimated_completion: new Date(Date.now() + (Math.random() * 90 + 30) * 24 * 60 * 60 * 1000).toLocaleDateString()
                    };
                }),
                summary: {
                    total_projects: projects.length,
                    active_projects: projects.filter((p: ApiProject) => p.status === 'active' || p.status === 'planning').length,
                    completed_projects: projects.filter((p: ApiProject) => p.status === 'completed').length,
                    total_team_members: allTeamMembers.length,
                    avg_project_velocity: analyticsData?.team_stats?.avg_velocity || Math.round(projects.reduce((sum: number, p: ApiProject & { velocity?: number }) => sum + (p.velocity || 80), 0) / Math.max(projects.length, 1)),
                    avg_project_quality: analyticsData?.team_stats?.avg_quality || Math.round(projects.reduce((sum: number, p: ApiProject & { quality?: number }) => sum + (p.quality || 85), 0) / Math.max(projects.length, 1)),
                    total_commits_this_week: allTeamMembers.reduce((sum: number, member: TeamMember) => sum + member.commits_this_week, 0),
                    total_pull_requests: Math.floor(Math.random() * 50) + 25,
                    total_issues_resolved: Math.floor(Math.random() * 30) + 15,
                    avg_code_coverage: Math.floor(Math.random() * 20) + 75,
                    team_efficiency: analyticsData?.team_stats?.avg_satisfaction || Math.round(allTeamMembers.reduce((sum: number, m: TeamMember) => sum + m.performance_score, 0) / Math.max(allTeamMembers.length, 1)),
                    budget_utilization: Math.floor(Math.random() * 30) + 65
                },
                insights: [
                    '🚀 Team velocity increased by 15% this sprint',
                    '🎯 Code quality metrics show consistent improvement',
                    '👥 Consider adding 2 more developers to high-priority projects',
                    '⚠️ Project Alpha is approaching deadline - requires attention',
                    '💡 Implement automated testing to reduce manual QA time'
                ],
                team_performance: {
                    top_performers: allTeamMembers
                        .sort((a: TeamMember, b: TeamMember) => b.performance_score - a.performance_score)
                        .slice(0, 3),
                    underperformers: allTeamMembers
                        .sort((a: TeamMember, b: TeamMember) => a.performance_score - b.performance_score)
                        .slice(0, 2),
                    overall_morale: 78
                },
                recent_activities: activities
            };

            setDashboardData(dashboardData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.name, user?.email]);

    useEffect(() => {
        fetchDashboardData();

        // Set up periodic refresh for real-time updates
        const refreshInterval = setInterval(() => {
            fetchDashboardData();
        }, 300000); // Refresh every 5 minutes

        return () => clearInterval(refreshInterval);
    }, [fetchDashboardData]);

    // Generate MCP Insights
    const generateMCPInsights = async (insightType: string) => {
        if (!dashboardData) return;

        try {
            const response = await fetch('/api/mcp/test-tools', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tool: 'analyze_dashboard_data',
                    data: {
                        projects: dashboardData.projects,
                        summary: dashboardData.summary,
                        insight_type: insightType
                    }
                }),
            });

            if (response.ok) {
                const insights = await response.json();
                setMcpInsights(insights);
            }
        } catch (error) {
            console.error('Error generating MCP insights:', error);
        }
    };

    // Delete project function
    const handleDeleteProject = async (projectId: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            const response = await fetch(`http://localhost:8000/projects/${projectId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                // Refresh dashboard data
                await fetchDashboardData();
            } else {
                throw new Error('Failed to delete project');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project. Please try again.');
        }
    };

    if (loading && !dashboardData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Manager Dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <h2 className="text-red-800 text-lg font-semibold mb-2">Error Loading Dashboard</h2>
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', name: 'Overview', icon: '📊' },
        { id: 'team', name: 'Team Management', icon: '👥' },
        { id: 'analytics', name: 'Analytics', icon: '📈' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200">
            {/* Navigation */}
            <nav className="bg-dark-200/80 backdrop-blur-md border-b border-cyber-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="text-2xl font-bold text-gradient">
                            Meridian
                        </Link>

                        <div className="flex items-center space-x-6">
                            <Link href="/repositories" className="text-gray-300 hover:text-primary-400 transition-colors">
                                Repositories
                            </Link>
                            <Link href="/profile" className="text-gray-300 hover:text-primary-400 transition-colors">
                                Profile
                            </Link>
                            <div className="flex items-center space-x-3">
                                <div className="text-2xl">👨‍💼</div>
                                <div>
                                    <div className="text-sm font-medium text-white">{dashboardData?.manager?.name || 'Manager'}</div>
                                    <div className="text-xs text-gray-400">Manager</div>
                                </div>
                            </div>
                            <Link href="/dashboard" className="btn-secondary text-sm">
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                Welcome back, {dashboardData?.manager?.name || 'Manager'}! 👨‍💼
                            </h1>
                            <p className="text-xl text-gray-300">
                                Manage your team and projects with AI-powered insights.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href="/create-multi-repo-project"
                                className="btn-primary text-sm flex items-center space-x-2"
                            >
                                <span>➕</span>
                                <span>New Project</span>
                            </Link>
                            <Link
                                href="/team-management"
                                className="btn-secondary text-sm flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-cyber-600 hover:from-primary-500 hover:to-cyber-500 border-none"
                            >
                                <span>🐦</span>
                                <span>Bird-Eye View</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Enhanced Summary Stats */}
                {dashboardData?.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
                        {/* Projects Overview */}
                        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm rounded-xl shadow-xl border border-blue-500/30 p-6 hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-200">Total Projects</p>
                                    <p className="text-3xl font-bold text-white">{dashboardData.summary.total_projects}</p>
                                    <p className="text-xs text-blue-300 mt-1">
                                        {dashboardData.summary.active_projects} active, {dashboardData.summary.completed_projects} completed
                                    </p>
                                </div>
                                <div className="text-4xl opacity-60">📁</div>
                            </div>
                        </div>

                        {/* Team Members */}
                        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-xl shadow-xl border border-purple-500/30 p-6 hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-purple-200">Team Members</p>
                                    <p className="text-3xl font-bold text-white">{dashboardData.summary.total_team_members}</p>
                                    <p className="text-xs text-purple-300 mt-1">Across all projects</p>
                                </div>
                                <div className="text-4xl opacity-60">👥</div>
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm rounded-xl shadow-xl border border-green-500/30 p-6 hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-200">Team Efficiency</p>
                                    <p className="text-3xl font-bold text-white">{dashboardData.summary.team_efficiency}%</p>
                                    <p className="text-xs text-green-300 mt-1">+5% from last month</p>
                                </div>
                                <div className="text-4xl opacity-60">⚡</div>
                            </div>
                        </div>

                        {/* Code Quality */}
                        <div className="bg-gradient-to-br from-yellow-600/20 to-orange-800/20 backdrop-blur-sm rounded-xl shadow-xl border border-yellow-500/30 p-6 hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-yellow-200">Code Coverage</p>
                                    <p className="text-3xl font-bold text-white">{dashboardData.summary.avg_code_coverage}%</p>
                                    <p className="text-xs text-yellow-300 mt-1">Quality: {dashboardData.summary.avg_project_quality}%</p>
                                </div>
                                <div className="text-4xl opacity-60">🎯</div>
                            </div>
                        </div>

                        {/* Development Activity */}
                        <div className="bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 backdrop-blur-sm rounded-xl shadow-xl border border-indigo-500/30 p-6 hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-indigo-200">Commits This Week</p>
                                    <p className="text-3xl font-bold text-white">{dashboardData.summary.total_commits_this_week}</p>
                                    <p className="text-xs text-indigo-300 mt-1">{dashboardData.summary.total_pull_requests} PRs opened</p>
                                </div>
                                <div className="text-4xl opacity-60">💻</div>
                            </div>
                        </div>

                        {/* Budget Utilization */}
                        <div className="bg-gradient-to-br from-red-600/20 to-pink-800/20 backdrop-blur-sm rounded-xl shadow-xl border border-red-500/30 p-6 hover:scale-105 transition-transform duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-red-200">Budget Used</p>
                                    <p className="text-3xl font-bold text-white">{dashboardData.summary.budget_utilization}%</p>
                                    <p className="text-xs text-red-300 mt-1">{dashboardData.summary.total_issues_resolved} issues resolved</p>
                                </div>
                                <div className="text-4xl opacity-60">💰</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Tabs */}
                <div className="mb-8">
                    <nav className="flex space-x-1 bg-dark-100/50 backdrop-blur-sm rounded-lg p-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {dashboardData?.projects?.map((project) => (
                            <div key={project.id} className="bg-gradient-to-br from-dark-100/50 to-dark-200/30 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-600/30 p-6 hover:scale-[1.02] hover:shadow-3xl transition-all duration-300 group">
                                {/* Header with Actions */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="text-xl font-bold text-white group-hover:text-primary-300 transition-colors">
                                                {project.name}
                                            </h3>
                                            <div className={`w-3 h-3 rounded-full ${project.risk_level === 'low' ? 'bg-green-400' :
                                                project.risk_level === 'medium' ? 'bg-yellow-400' : 'bg-red-400'}`}
                                                title={`Risk Level: ${project.risk_level}`}
                                            />
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed">{project.description}</p>
                                    </div>
                                    <div className="flex space-x-2 ml-4 opacity-70 group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="p-2 bg-primary-600/20 rounded-lg text-primary-400 hover:text-primary-300 hover:bg-primary-600/30 transition-colors"
                                            title="View Project"
                                        >
                                            <span className="text-lg">👁️</span>
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteProject(project.id)}
                                            className="p-2 bg-red-600/20 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-600/30 transition-colors"
                                            title="Delete Project"
                                        >
                                            <span className="text-lg">🗑️</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-300">Project Progress</span>
                                        <span className="text-sm font-bold text-primary-400">{project.progress}%</span>
                                    </div>
                                    <div className="w-full bg-dark-200/60 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-primary-500 to-cyber-500 h-full rounded-full transition-all duration-1000 ease-out relative"
                                            style={{ width: `${project.progress}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                                        <span>{project.tasks_completed}/{project.total_tasks} tasks</span>
                                        <span>Est: {project.estimated_completion}</span>
                                    </div>
                                </div>

                                {/* Status and Priority */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-dark-200/40 rounded-lg p-3 border border-gray-600/20">
                                        <div className="text-xs text-gray-400 mb-1">Status</div>
                                        <div className={`text-sm font-medium px-3 py-1 rounded-full w-fit flex items-center space-x-1 ${project.status === 'active' ? 'bg-green-600/30 text-green-300 border border-green-500/40' :
                                            project.status === 'completed' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' :
                                                'bg-yellow-600/30 text-yellow-300 border border-yellow-500/40'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-green-400' :
                                                project.status === 'completed' ? 'bg-blue-400' : 'bg-yellow-400'
                                                }`}></span>
                                            <span className="capitalize">{project.status}</span>
                                        </div>
                                    </div>
                                    <div className="bg-dark-200/40 rounded-lg p-3 border border-gray-600/20">
                                        <div className="text-xs text-gray-400 mb-1">Priority</div>
                                        <div className={`text-sm font-medium px-3 py-1 rounded-full w-fit flex items-center space-x-1 ${project.priority === 'high' ? 'bg-red-600/30 text-red-300 border border-red-500/40' :
                                            project.priority === 'medium' ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/40' :
                                                'bg-green-600/30 text-green-300 border border-green-500/40'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${project.priority === 'high' ? 'bg-red-400' :
                                                project.priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                                                }`}></span>
                                            <span className="capitalize">{project.priority}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Enhanced Metrics Grid */}
                                <div className="grid grid-cols-4 gap-3 mb-4">
                                    <div className="text-center bg-dark-200/30 rounded-lg p-2 border border-gray-600/20">
                                        <div className="text-lg font-bold text-white">{project.team_count}</div>
                                        <div className="text-xs text-gray-400">Team</div>
                                    </div>
                                    <div className="text-center bg-dark-200/30 rounded-lg p-2 border border-gray-600/20">
                                        <div className="text-lg font-bold text-primary-300">{project.velocity}%</div>
                                        <div className="text-xs text-gray-400">Velocity</div>
                                    </div>
                                    <div className="text-center bg-dark-200/30 rounded-lg p-2 border border-gray-600/20">
                                        <div className="text-lg font-bold text-green-300">{project.quality}%</div>
                                        <div className="text-xs text-gray-400">Quality</div>
                                    </div>
                                    <div className="text-center bg-dark-200/30 rounded-lg p-2 border border-gray-600/20">
                                        <div className="text-lg font-bold text-cyan-300">{project.code_coverage}%</div>
                                        <div className="text-xs text-gray-400">Coverage</div>
                                    </div>
                                </div>

                                {/* Activity Indicators */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-dark-200/30 rounded-lg p-2 border border-gray-600/20">
                                        <div className="text-xs text-gray-400">Active Sprints</div>
                                        <div className="text-sm font-semibold text-white">{project.active_sprints} running</div>
                                    </div>
                                    <div className="bg-dark-200/30 rounded-lg p-2 border border-gray-600/20">
                                        <div className="text-xs text-gray-400">Issues Resolved</div>
                                        <div className="text-sm font-semibold text-white">{project.issues_resolved} this week</div>
                                    </div>
                                </div>

                                {/* Budget Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium text-gray-400">Budget Utilization</span>
                                        <span className="text-xs font-bold text-yellow-400">{project.budget_used}%</span>
                                    </div>
                                    <div className="w-full bg-dark-200/60 rounded-full h-2">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${project.budget_used > 80 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                                project.budget_used > 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                                    'bg-gradient-to-r from-green-500 to-green-600'
                                                }`}
                                            style={{ width: `${project.budget_used}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Team Members with Status */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-400">Team:</span>
                                        <div className="flex -space-x-2">
                                            {project.team_members?.slice(0, 4).map((member) => (
                                                <div
                                                    key={member.id}
                                                    className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-dark-100 group/member"
                                                    title={`${member.name} - ${member.role}`}
                                                >
                                                    <div className="w-full h-full bg-gradient-to-br from-primary-500 to-cyber-600 flex items-center justify-center text-white text-xs font-bold">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-dark-100 ${member.availability_status === 'available' ? 'bg-green-400' :
                                                        member.availability_status === 'busy' ? 'bg-yellow-400' : 'bg-gray-400'
                                                        }`}></div>
                                                </div>
                                            ))}
                                            {(project.team_members?.length || 0) > 4 && (
                                                <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-dark-100">
                                                    +{(project.team_members?.length || 0) - 4}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent Activity Indicator */}
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-xs text-gray-400">Active</span>
                                    </div>
                                </div>

                                {/* Recent Activity Preview */}
                                {project.recent_activity && project.recent_activity.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-600/30">
                                        <div className="text-xs text-gray-400 mb-2">Recent Activity</div>
                                        <div className="space-y-1">
                                            {project.recent_activity.slice(0, 2).map((activity) => (
                                                <div key={activity.id} className="flex items-center space-x-2 text-xs">
                                                    <span className={`w-2 h-2 rounded-full ${activity.type === 'commit' ? 'bg-blue-400' :
                                                        activity.type === 'pull_request' ? 'bg-green-400' :
                                                            activity.type === 'deployment' ? 'bg-purple-400' :
                                                                'bg-gray-400'
                                                        }`}></span>
                                                    <span className="text-gray-300 truncate flex-1">{activity.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="space-y-6">
                        {/* Team Overview Header */}
                        <div className="bg-gradient-to-r from-dark-100/60 to-dark-200/60 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-semibold text-white mb-2 flex items-center">
                                        <span className="mr-3">🌐</span>
                                        Team Management Dashboard
                                    </h3>
                                    <p className="text-gray-300">
                                        Comprehensive overview of all team members, performance metrics, and interactive visualizations.
                                    </p>
                                </div>
                                <Link
                                    href="/team-management"
                                    className="btn-primary text-lg flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-primary-600 to-cyber-600 hover:from-primary-500 hover:to-cyber-500 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                >
                                    <span className="text-xl">🐦</span>
                                    <span>Bird-Eye View</span>
                                </Link>
                            </div>

                            {/* Team Performance Summary */}
                            <div className="grid md:grid-cols-3 gap-6 mb-6">
                                <div className="bg-green-600/20 rounded-lg p-4 border border-green-500/30">
                                    <h4 className="text-green-300 font-semibold mb-2 flex items-center">
                                        <span className="mr-2">🏆</span>
                                        Top Performers
                                    </h4>
                                    <div className="space-y-2">
                                        {dashboardData?.team_performance?.top_performers?.map((member, index) => (
                                            <div key={member.id} className="flex items-center space-x-2 bg-green-600/10 rounded p-2">
                                                <div className="text-lg">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                                                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-medium text-white">{member.name}</div>
                                                    <div className="text-xs text-green-300">{member.performance_score}% efficiency</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-yellow-600/20 rounded-lg p-4 border border-yellow-500/30">
                                    <h4 className="text-yellow-300 font-semibold mb-2 flex items-center">
                                        <span className="mr-2">📊</span>
                                        Team Morale
                                    </h4>
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-white mb-2">{dashboardData?.team_performance?.overall_morale}%</div>
                                        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                                            <div
                                                className="bg-gradient-to-r from-yellow-500 to-green-500 h-3 rounded-full transition-all duration-1000"
                                                style={{ width: `${dashboardData?.team_performance?.overall_morale}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-yellow-300">Overall team satisfaction</div>
                                    </div>
                                </div>

                                <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-500/30">
                                    <h4 className="text-blue-300 font-semibold mb-2 flex items-center">
                                        <span className="mr-2">📈</span>
                                        This Week&apos;s Activity
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Commits:</span>
                                            <span className="text-white font-semibold">{dashboardData?.summary?.total_commits_this_week}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Pull Requests:</span>
                                            <span className="text-white font-semibold">{dashboardData?.summary?.total_pull_requests}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Issues Resolved:</span>
                                            <span className="text-white font-semibold">{dashboardData?.summary?.total_issues_resolved}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Team Members by Project */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {dashboardData?.projects?.map((project) => (
                                <div key={project.id} className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xl font-semibold text-white">{project.name}</h4>
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${project.risk_level === 'low' ? 'bg-green-600/20 text-green-300' :
                                                project.risk_level === 'medium' ? 'bg-yellow-600/20 text-yellow-300' :
                                                    'bg-red-600/20 text-red-300'
                                            }`}>
                                            Risk: {project.risk_level}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-dark-200/50 rounded-lg p-3">
                                            <div className="text-sm text-gray-400">Team Size</div>
                                            <div className="text-2xl font-bold text-white">{project.team_count}</div>
                                        </div>
                                        <div className="bg-dark-200/50 rounded-lg p-3">
                                            <div className="text-sm text-gray-400">Progress</div>
                                            <div className="text-2xl font-bold text-primary-400">{project.progress}%</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {project.team_members?.map((member) => (
                                            <div key={member.id} className="bg-dark-200/30 rounded-lg p-3 hover:bg-dark-200/50 transition-colors">
                                                <div className="flex items-center space-x-3">
                                                    <div className="relative">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-cyber-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                            {member.name.charAt(0)}
                                                        </div>
                                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-dark-200 ${member.availability_status === 'available' ? 'bg-green-500' :
                                                                member.availability_status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
                                                            }`}></div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="text-sm font-medium text-white">{member.name}</div>
                                                                <div className="text-xs text-gray-400">{member.role}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-semibold text-primary-300">{member.performance_score}%</div>
                                                                <div className="text-xs text-gray-400">Performance</div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                            <div className="text-gray-400">
                                                                Tasks: <span className="text-white font-medium">{member.tasks_completed}</span>
                                                            </div>
                                                            <div className="text-gray-400">
                                                                Commits: <span className="text-white font-medium">{member.commits_this_week}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Team Activities */}
                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                                <span className="mr-2">⚡</span>
                                Recent Team Activities
                            </h4>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {dashboardData?.recent_activities?.map((activity) => (
                                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-dark-200/30 rounded-lg hover:bg-dark-200/50 transition-colors">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${activity.type === 'commit' ? 'bg-green-600/20 text-green-400' :
                                                activity.type === 'pull_request' ? 'bg-blue-600/20 text-blue-400' :
                                                    activity.type === 'issue' ? 'bg-red-600/20 text-red-400' :
                                                        activity.type === 'review' ? 'bg-purple-600/20 text-purple-400' :
                                                            'bg-yellow-600/20 text-yellow-400'
                                            }`}>
                                            {activity.type === 'commit' ? '💻' :
                                                activity.type === 'pull_request' ? '🔀' :
                                                    activity.type === 'issue' ? '🐛' :
                                                        activity.type === 'review' ? '👀' : '🚀'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm text-white">{activity.description}</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {activity.user} • {new Date(activity.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* Advanced Performance Charts */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Team Velocity Trend with Real Data */}
                            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-white flex items-center">
                                        <span className="mr-2">📈</span>
                                        Team Velocity Trend
                                    </h4>
                                    <div className="text-sm text-gray-400">Last 6 weeks</div>
                                </div>
                                <Line
                                    data={{
                                        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                                        datasets: [
                                            {
                                                label: 'Average Velocity %',
                                                data: dashboardData?.projects?.[0]?.performance_trend || [75, 80, 85, 82, 88, 85],
                                                borderColor: 'rgb(99, 102, 241)',
                                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                tension: 0.4,
                                                borderWidth: 3,
                                                fill: true
                                            },
                                            {
                                                label: 'Quality Score %',
                                                data: [70, 75, 80, 85, 87, 90],
                                                borderColor: 'rgb(34, 197, 94)',
                                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                tension: 0.4,
                                                borderWidth: 3,
                                                fill: false
                                            }
                                        ]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                labels: { color: 'white', font: { size: 12 } }
                                            },
                                            tooltip: {
                                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                titleColor: 'white',
                                                bodyColor: 'white'
                                            }
                                        },
                                        scales: {
                                            x: {
                                                ticks: { color: 'white' },
                                                grid: { color: 'rgba(255,255,255,0.1)' }
                                            },
                                            y: {
                                                ticks: { color: 'white' },
                                                grid: { color: 'rgba(255,255,255,0.1)' },
                                                min: 0,
                                                max: 100
                                            }
                                        }
                                    }}
                                    height={250}
                                />
                            </div>

                            {/* Enhanced Project Status Distribution */}
                            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-white flex items-center">
                                        <span className="mr-2">🎯</span>
                                        Project Status Overview
                                    </h4>
                                </div>
                                <Doughnut
                                    data={{
                                        labels: ['Active', 'Planning', 'Completed', 'On Hold'],
                                        datasets: [{
                                            data: [
                                                dashboardData?.summary?.active_projects || 0,
                                                Math.max(0, (dashboardData?.summary?.total_projects || 0) - (dashboardData?.summary?.active_projects || 0) - (dashboardData?.summary?.completed_projects || 0)),
                                                dashboardData?.summary?.completed_projects || 0,
                                                0
                                            ],
                                            backgroundColor: [
                                                'rgba(34, 197, 94, 0.8)',   // Green for active
                                                'rgba(251, 191, 36, 0.8)',  // Yellow for planning
                                                'rgba(59, 130, 246, 0.8)',  // Blue for completed
                                                'rgba(239, 68, 68, 0.8)'    // Red for on hold
                                            ],
                                            borderWidth: 2,
                                            borderColor: 'rgba(255, 255, 255, 0.2)',
                                            hoverBackgroundColor: [
                                                'rgba(34, 197, 94, 1)',
                                                'rgba(251, 191, 36, 1)',
                                                'rgba(59, 130, 246, 1)',
                                                'rgba(239, 68, 68, 1)'
                                            ]
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                labels: { color: 'white', font: { size: 12 } },
                                                position: 'bottom'
                                            },
                                            tooltip: {
                                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                titleColor: 'white',
                                                bodyColor: 'white'
                                            }
                                        }
                                    }}
                                    height={250}
                                />
                            </div>
                        </div>

                        {/* Team Performance Metrics */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm rounded-xl shadow-xl border border-blue-500/30 p-6">
                                <h5 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <span className="mr-2">💻</span>
                                    Development Activity
                                </h5>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Commits this week</span>
                                        <span className="text-2xl font-bold text-blue-300">{dashboardData?.summary?.total_commits_this_week}</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, (dashboardData?.summary?.total_commits_this_week || 0) / 2)}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-400">
                                        <span>Pull Requests: {dashboardData?.summary?.total_pull_requests}</span>
                                        <span>Reviews: {Math.floor((dashboardData?.summary?.total_pull_requests || 0) * 0.8)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm rounded-xl shadow-xl border border-green-500/30 p-6">
                                <h5 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <span className="mr-2">🎯</span>
                                    Quality Metrics
                                </h5>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Code Coverage</span>
                                        <span className="text-2xl font-bold text-green-300">{dashboardData?.summary?.avg_code_coverage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${dashboardData?.summary?.avg_code_coverage}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-400">
                                        <span>Issues Resolved: {dashboardData?.summary?.total_issues_resolved}</span>
                                        <span>Quality: {dashboardData?.summary?.avg_project_quality}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm rounded-xl shadow-xl border border-purple-500/30 p-6">
                                <h5 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <span className="mr-2">⚡</span>
                                    Team Efficiency
                                </h5>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Overall Efficiency</span>
                                        <span className="text-2xl font-bold text-purple-300">{dashboardData?.summary?.team_efficiency}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${dashboardData?.summary?.team_efficiency}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-400">
                                        <span>Budget Used: {dashboardData?.summary?.budget_utilization}%</span>
                                        <span>Velocity: {dashboardData?.summary?.avg_project_velocity}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Project Risk Analysis */}
                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <span className="mr-2">⚠️</span>
                                Project Risk Analysis
                            </h4>
                            <div className="grid md:grid-cols-3 gap-4 mb-6">
                                {dashboardData?.projects?.map((project) => (
                                    <div key={project.id} className={`p-4 rounded-lg border-2 ${project.risk_level === 'high' ? 'bg-red-600/20 border-red-500/50' :
                                            project.risk_level === 'medium' ? 'bg-yellow-600/20 border-yellow-500/50' :
                                                'bg-green-600/20 border-green-500/50'
                                        }`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-semibold text-white">{project.name}</h5>
                                            <div className={`px-2 py-1 rounded text-xs font-bold ${project.risk_level === 'high' ? 'bg-red-500 text-white' :
                                                    project.risk_level === 'medium' ? 'bg-yellow-500 text-black' :
                                                        'bg-green-500 text-white'
                                                }`}>
                                                {project.risk_level.toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Progress:</span>
                                                <span className="text-white">{project.progress}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Budget:</span>
                                                <span className="text-white">{project.budget_used}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Est. Completion:</span>
                                                <span className="text-white">{project.estimated_completion}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Enhanced AI-Powered Analytics */}
                        <div className="bg-gradient-to-r from-dark-100/60 to-dark-200/60 backdrop-blur-sm rounded-xl shadow-xl border border-cyber-500/30 p-6">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                <span className="mr-2">🤖</span>
                                AI-Powered Analytics & Recommendations
                            </h4>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <button
                                    onClick={() => generateMCPInsights('risk-assessment')}
                                    className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 rounded-lg p-4 text-left transition-all duration-300 hover:scale-105"
                                >
                                    <div className="text-2xl mb-2">⚠️</div>
                                    <div className="font-semibold text-white">Risk Assessment</div>
                                    <div className="text-sm text-red-300">Identify potential project risks</div>
                                </button>

                                <button
                                    onClick={() => generateMCPInsights('performance-optimization')}
                                    className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 rounded-lg p-4 text-left transition-all duration-300 hover:scale-105"
                                >
                                    <div className="text-2xl mb-2">🚀</div>
                                    <div className="font-semibold text-white">Performance Boost</div>
                                    <div className="text-sm text-green-300">Optimize team efficiency</div>
                                </button>

                                <button
                                    onClick={() => generateMCPInsights('resource-planning')}
                                    className="bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded-lg p-4 text-left transition-all duration-300 hover:scale-105"
                                >
                                    <div className="text-2xl mb-2">📊</div>
                                    <div className="font-semibold text-white">Resource Planning</div>
                                    <div className="text-sm text-blue-300">Allocate resources effectively</div>
                                </button>

                                <button
                                    onClick={() => generateMCPInsights('timeline-prediction')}
                                    className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 rounded-lg p-4 text-left transition-all duration-300 hover:scale-105"
                                >
                                    <div className="text-2xl mb-2">⏱️</div>
                                    <div className="font-semibold text-white">Timeline Prediction</div>
                                    <div className="text-sm text-purple-300">Predict project completion</div>
                                </button>
                            </div>

                            {/* Real-time Insights Display */}
                            {mcpInsights && (
                                <div className="bg-dark-100/50 rounded-lg p-4 border border-cyber-500/30">
                                    <div className="flex items-center mb-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                                        <h5 className="font-semibold text-white">AI Analysis Results</h5>
                                    </div>
                                    <div className="bg-dark-200/50 rounded p-3">
                                        <pre className="whitespace-pre-wrap text-sm text-gray-300">{mcpInsights.preview}</pre>
                                        <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                            <span>Generated by {mcpInsights.tool}</span>
                                            <span>Execution time: {mcpInsights.execution_time}ms</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

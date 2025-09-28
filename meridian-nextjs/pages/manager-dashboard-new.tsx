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
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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
    team_members: TeamMember[];
    repositories?: Array<{
        id?: string;
        repository_name: string;
        repository_url: string;
        is_primary: boolean;
    }>;
    metrics: Record<string, { value: number; recorded_at: string }>;
}

interface TeamMember {
    id: string;
    name: string;
    role: string;
    github_username: string;
    avatar_url?: string;
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
        total_team_members: number;
        avg_project_velocity: number;
        avg_project_quality: number;
    };
    insights: string[];
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

    // Fetch dashboard data
    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`http://localhost:8000/manager-dashboard/${user.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch dashboard data: ${response.status}`);
            }

            const data = await response.json();
            setDashboardData(data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchDashboardData();
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

                {/* Summary Stats */}
                {dashboardData?.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-blue-600/20 rounded-lg">
                                    <div className="text-2xl">📁</div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-400">Total Projects</p>
                                    <p className="text-2xl font-semibold text-white">{dashboardData.summary.total_projects}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-green-600/20 rounded-lg">
                                    <div className="text-2xl">🚀</div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-400">Active Projects</p>
                                    <p className="text-2xl font-semibold text-white">{dashboardData.summary.active_projects}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-purple-600/20 rounded-lg">
                                    <div className="text-2xl">👥</div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-400">Team Members</p>
                                    <p className="text-2xl font-semibold text-white">{dashboardData.summary.total_team_members}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-yellow-600/20 rounded-lg">
                                    <div className="text-2xl">⚡</div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-400">Avg Velocity</p>
                                    <p className="text-2xl font-semibold text-white">{dashboardData.summary.avg_project_velocity}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <div className="flex items-center">
                                <div className="p-2 bg-red-600/20 rounded-lg">
                                    <div className="text-2xl">🎯</div>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-400">Avg Quality</p>
                                    <p className="text-2xl font-semibold text-white">{dashboardData.summary.avg_project_quality}%</p>
                                </div>
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
                    <div className="grid lg:grid-cols-2 gap-6">
                        {dashboardData?.projects.map((project) => (
                            <div key={project.id} className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6 hover:bg-dark-100/60 transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-white mb-2">{project.name}</h3>
                                        <p className="text-gray-300 leading-relaxed">{project.description}</p>
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <Link
                                            href={`/projects/${project.id}`}
                                            className="text-primary-400 hover:text-primary-300 transition-colors"
                                        >
                                            <span className="text-lg">👁️</span>
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteProject(project.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <span className="text-lg">🗑️</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-dark-200/50 rounded-lg p-3">
                                        <div className="text-sm text-gray-400 mb-1">Status</div>
                                        <div className={`text-sm font-medium px-2 py-1 rounded-full w-fit ${project.status === 'active' ? 'bg-green-600/20 text-green-300' :
                                                project.status === 'completed' ? 'bg-blue-600/20 text-blue-300' :
                                                    'bg-yellow-600/20 text-yellow-300'
                                            }`}>
                                            {project.status}
                                        </div>
                                    </div>
                                    <div className="bg-dark-200/50 rounded-lg p-3">
                                        <div className="text-sm text-gray-400 mb-1">Priority</div>
                                        <div className={`text-sm font-medium px-2 py-1 rounded-full w-fit ${project.priority === 'high' ? 'bg-red-600/20 text-red-300' :
                                                project.priority === 'medium' ? 'bg-yellow-600/20 text-yellow-300' :
                                                    'bg-green-600/20 text-green-300'
                                            }`}>
                                            {project.priority}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-white">{project.team_count}</div>
                                        <div className="text-xs text-gray-400">Team Members</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-white">{project.velocity}%</div>
                                        <div className="text-xs text-gray-400">Velocity</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-white">{project.quality}%</div>
                                        <div className="text-xs text-gray-400">Quality</div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-400">Team:</span>
                                    <div className="flex -space-x-2">
                                        {project.team_members.slice(0, 3).map((member) => (
                                            <div
                                                key={member.id}
                                                className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-dark-100"
                                                title={member.name}
                                            >
                                                {member.name.charAt(0)}
                                            </div>
                                        ))}
                                        {project.team_members.length > 3 && (
                                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-dark-100">
                                                +{project.team_members.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="space-y-6">
                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <div className="mb-6">
                                <h3 className="text-2xl font-semibold text-white mb-2">🌐 Team Management</h3>
                                <p className="text-gray-300">
                                    Overview of all team members across your projects. Use the Bird-Eye View for interactive team visualization.
                                </p>
                            </div>

                            <div className="flex justify-center mb-8">
                                <Link
                                    href="/team-management"
                                    className="btn-primary text-lg flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-cyber-600 hover:from-primary-500 hover:to-cyber-500 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                                >
                                    <span className="text-2xl">🐦</span>
                                    <span>Open Bird-Eye View</span>
                                    <span className="text-2xl">🚀</span>
                                </Link>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {dashboardData?.projects.map((project) => (
                                    <div key={project.id} className="bg-dark-200/50 rounded-lg p-4">
                                        <h4 className="font-semibold text-white mb-3">{project.name}</h4>
                                        <div className="space-y-2">
                                            {project.team_members.map((member) => (
                                                <div key={member.id} className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-white">{member.name}</div>
                                                        <div className="text-xs text-gray-400">{member.role}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* Performance Charts */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Team Velocity Trend */}
                            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                                <h4 className="text-lg font-semibold text-white mb-4">📈 Team Velocity Trend</h4>
                                <Line
                                    data={{
                                        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                                        datasets: [{
                                            label: 'Velocity %',
                                            data: [75, 80, 85, 82, 88, 85],
                                            borderColor: 'rgb(99, 102, 241)',
                                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                            tension: 0.4,
                                            borderWidth: 2
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        plugins: { legend: { labels: { color: 'white' } } },
                                        scales: {
                                            x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                                            y: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                                        }
                                    }}
                                />
                            </div>

                            {/* Project Quality Distribution */}
                            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                                <h4 className="text-lg font-semibold text-white mb-4">🎯 Quality Distribution</h4>
                                <Doughnut
                                    data={{
                                        labels: ['Excellent', 'Good', 'Average', 'Needs Improvement'],
                                        datasets: [{
                                            data: [30, 45, 20, 5],
                                            backgroundColor: [
                                                'rgba(34, 197, 94, 0.8)',
                                                'rgba(59, 130, 246, 0.8)',
                                                'rgba(251, 191, 36, 0.8)',
                                                'rgba(239, 68, 68, 0.8)'
                                            ],
                                            borderWidth: 2,
                                            borderColor: 'rgba(255, 255, 255, 0.1)'
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        plugins: { legend: { labels: { color: 'white' } } }
                                    }}
                                />
                            </div>
                        </div>

                        {/* AI-Powered Analytics Actions */}
                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <h4 className="text-lg font-semibold text-white mb-4">🤖 AI-Powered Analytics & Actions</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => generateMCPInsights('analytics-risk')}
                                    className="btn-primary flex items-center space-x-3 p-4"
                                >
                                    <span className="text-2xl">⚠️</span>
                                    <div className="text-left">
                                        <div className="font-medium">Project Risk Assessment</div>
                                        <div className="text-sm opacity-80">AI analysis of project risks and mitigation strategies</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => generateMCPInsights('team-optimization')}
                                    className="btn-secondary flex items-center space-x-3 p-4"
                                >
                                    <span className="text-2xl">⚡</span>
                                    <div className="text-left">
                                        <div className="font-medium">Team Performance Optimization</div>
                                        <div className="text-sm opacity-80">Get AI suggestions for improving team efficiency</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* MCP Insights Display */}
                        {mcpInsights && (
                            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                                <h4 className="text-lg font-semibold text-white mb-4">🧠 AI Analysis Results</h4>
                                <div className="bg-dark-100/50 rounded-lg p-4">
                                    <pre className="whitespace-pre-wrap text-sm text-gray-300">{mcpInsights.preview}</pre>
                                    <div className="text-xs text-gray-500 mt-2">
                                        Generated in {mcpInsights.execution_time}ms using {mcpInsights.tool}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

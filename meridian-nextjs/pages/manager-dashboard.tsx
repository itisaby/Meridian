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
    metrics: Record<string, { value: number; recorded_at: string }>;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
    user_role: string;
    project_role: string;
    joined_at: string;
}

interface ManagerStats {
    total_team_members: number;
    total_projects: number;
    avg_velocity: number;
}

interface DashboardData {
    manager: {
        name: string;
        email: string;
        role: string;
    };
    projects: Project[];
    stats: ManagerStats;
}

interface MCPInsights {
    preview: string;
    execution_time: number;
    tool: string;
    data?: Record<string, unknown>;
}

export default function ManagerDashboard() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [mcpInsights, setMcpInsights] = useState<MCPInsights | null>(null);

    const loadMockData = () => {
        // Mock data for demo purposes - will be replaced by API calls when manager authentication is implemented
        const mockData: DashboardData = {
            manager: {
                name: "Manager User",
                email: "manager@meridian.dev",
                role: "manager"
            },
            projects: [
                {
                    id: "1",
                    name: "E-commerce Platform",
                    description: "Modern React-based e-commerce solution",
                    status: "active",
                    priority: "high",
                    repository_url: "https://github.com/meridian/ecommerce",
                    team_count: 5,
                    velocity: 85,
                    quality: 92,
                    team_members: [
                        { id: "1", name: "Alex Chen", email: "alex@meridian.ai", user_role: "developer", project_role: "frontend", joined_at: "2024-01-15" },
                        { id: "2", name: "Maria Rodriguez", email: "maria@meridian.ai", user_role: "developer", project_role: "backend", joined_at: "2024-01-20" }
                    ],
                    metrics: {
                        code_coverage: { value: 85, recorded_at: "2024-03-15" },
                        deployment_frequency: { value: 12, recorded_at: "2024-03-15" }
                    }
                },
                {
                    id: "2",
                    name: "Mobile Analytics",
                    description: "Cross-platform mobile analytics dashboard",
                    status: "planning",
                    priority: "medium",
                    repository_url: "https://github.com/meridian/mobile-analytics",
                    team_count: 3,
                    velocity: 78,
                    quality: 88,
                    team_members: [
                        { id: "3", name: "David Kim", email: "david@meridian.ai", user_role: "developer", project_role: "mobile", joined_at: "2024-02-01" }
                    ],
                    metrics: {
                        code_coverage: { value: 78, recorded_at: "2024-03-15" },
                        deployment_frequency: { value: 8, recorded_at: "2024-03-15" }
                    }
                }
            ],
            stats: {
                total_team_members: 8,
                total_projects: 2,
                avg_velocity: 81.5
            }
        };

        setDashboardData(mockData);
        setLoading(false);
    };

    const fetchDashboardData = useCallback(async () => {
        if (!user?.id) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/manager/dashboard/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDashboardData(data);
            } else if (response.status === 403) {
                setError('Access denied. Manager role required.');
            } else {
                setError('Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        // For demo purposes, show mock data if no authentication or wrong role
        if (!isAuthenticated || !user || user.role !== 'manager') {
            loadMockData();
        } else {
            fetchDashboardData();
        }
    }, [isAuthenticated, user, fetchDashboardData]);

    const generateMCPInsights = async (projectId: string) => {
        if (!user?.id && projectId !== 'analytics-risk' && projectId !== 'team-optimization') {
            return await generateMCPInsightsWithUserId(projectId);
        }

        return await generateMCPInsightsWithUserId(projectId);
    };

    const generateMCPInsightsWithUserId = async (projectId: string) => {
        try {
            setLoading(true);

            // Use the actual manager user ID from database
            const managerUserId = 'f1f8a61b-13e9-49e7-a33c-cbff9fae8ff5';

            // Determine tool name and parameters based on project/action type
            let toolName = 'team_collaboration_insights';
            let additionalParams = {};

            switch (projectId) {
                case 'analytics-risk':
                    toolName = 'project_risk_assessment';
                    additionalParams = {
                        repository: 'meridian-ai/ecommerce-platform',
                        project_stage: 'active',
                        team_size: dashboardData?.stats?.total_team_members || 8
                    };
                    break;
                case 'team-optimization':
                    toolName = 'team_performance_optimization';
                    additionalParams = {
                        team_metrics: {
                            velocity: dashboardData?.stats?.avg_velocity || 85,
                            quality: 88,
                            collaboration: 95
                        },
                        team_size: dashboardData?.stats?.total_team_members || 8
                    };
                    break;
                default:
                    additionalParams = {
                        repository: 'meridian-ai/sample-project',
                        team_size: dashboardData?.projects.find(p => p.id === projectId)?.team_count || 5
                    };
            }

            const response = await fetch('/api/mcp-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tool_name: toolName,
                    user_id: managerUserId, // Use the actual manager user ID
                    ...additionalParams
                })
            });

            if (response.ok) {
                const result = await response.json();
                setMcpInsights(result.data);
            }
        } catch (error) {
            console.error('Error generating MCP insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-600/20 text-green-300 border border-green-500/30';
            case 'planning': return 'bg-yellow-600/20 text-yellow-300 border border-yellow-500/30';
            case 'completed': return 'bg-blue-600/20 text-blue-300 border border-blue-500/30';
            case 'paused': return 'bg-red-600/20 text-red-300 border border-red-500/30';
            default: return 'bg-gray-600/20 text-gray-300 border border-gray-500/30';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-600/20 text-red-300 border-red-500/30';
            case 'medium': return 'bg-yellow-600/20 text-yellow-300 border-yellow-500/30';
            case 'low': return 'bg-green-600/20 text-green-300 border-green-500/30';
            default: return 'bg-gray-600/20 text-gray-300 border-gray-500/30';
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
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Welcome back, {dashboardData?.manager?.name || 'Manager'}! 👨‍💼
                    </h1>
                    <p className="text-xl text-gray-300">
                        Manage your team and projects with AI-powered insights.
                    </p>
                </div>

                {/* MCP Feature Spotlight */}
                <div className="card p-8 mb-8 bg-gradient-to-r from-primary-600/20 via-cyber-600/20 to-primary-600/20 border border-primary-500/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="text-4xl">🤖</div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    AI-Powered Team Management
                                    <span className="ml-2 text-xs bg-cyber-500 text-white px-2 py-1 rounded-full">NEW</span>
                                </h2>
                                <p className="text-gray-300">
                                    Get intelligent insights on team collaboration, project risks, and performance optimization
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <Link href="/mcp-test" className="btn-secondary flex items-center space-x-2">
                                <span>🧪</span>
                                <span>MCP Tools</span>
                            </Link>
                            <button
                                onClick={fetchDashboardData}
                                className="btn-primary flex items-center space-x-2"
                            >
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="card border-l-4 border-primary-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-primary-400 text-sm font-medium">Total Projects</p>
                                <p className="text-3xl font-bold text-white">{dashboardData?.stats.total_projects}</p>
                            </div>
                            <div className="bg-primary-500/20 p-3 rounded-full">
                                <span className="text-2xl">📊</span>
                            </div>
                        </div>
                    </div>

                    <div className="card border-l-4 border-cyber-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-cyber-400 text-sm font-medium">Team Members</p>
                                <p className="text-3xl font-bold text-white">{dashboardData?.stats.total_team_members}</p>
                            </div>
                            <div className="bg-cyber-500/20 p-3 rounded-full">
                                <span className="text-2xl">👥</span>
                            </div>
                        </div>
                    </div>

                    <div className="card border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-400 text-sm font-medium">Avg Velocity</p>
                                <p className="text-3xl font-bold text-white">{dashboardData?.stats.avg_velocity}%</p>
                            </div>
                            <div className="bg-green-500/20 p-3 rounded-full">
                                <span className="text-2xl">🚀</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'overview', name: 'Project Overview', icon: '📊' },
                            { id: 'team', name: 'Team Management', icon: '👥' },
                            { id: 'insights', name: 'AI Insights', icon: '🧠' },
                            { id: 'analytics', name: 'Analytics', icon: '📈' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? 'border-primary-500 text-primary-400'
                                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                                    }`}
                            >
                                {tab.icon} {tab.name}
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
                                    <div className="flex flex-col gap-2 ml-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                            {project.status.toUpperCase()}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                                            {project.priority.toUpperCase()} PRIORITY
                                        </span>
                                    </div>
                                </div>

                                {/* Project Metrics */}
                                <div className="bg-dark-200/70 rounded-lg p-4 mb-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mb-2">
                                                <span className="text-2xl">👥</span>
                                            </div>
                                            <p className="text-2xl font-bold text-blue-400">{project.team_count}</p>
                                            <p className="text-xs text-gray-400">Team Size</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mb-2">
                                                <span className="text-2xl">⚡</span>
                                            </div>
                                            <p className="text-2xl font-bold text-green-400">{project.velocity}%</p>
                                            <p className="text-xs text-gray-400">Velocity</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mb-2">
                                                <span className="text-2xl">✨</span>
                                            </div>
                                            <p className="text-2xl font-bold text-purple-400">{project.quality}%</p>
                                            <p className="text-xs text-gray-400">Quality Score</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bars */}
                                <div className="space-y-3 mb-6">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-300">Development Progress</span>
                                            <span className="text-sm text-gray-400">{project.velocity}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${project.velocity}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-300">Code Quality</span>
                                            <span className="text-sm text-gray-400">{project.quality}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-indigo-400 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${project.quality}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => generateMCPInsights(project.id)}
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <span>🧠</span>
                                        Generate AI Insights
                                    </button>
                                    {project.repository_url && (
                                        <a
                                            href={project.repository_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-gray-600/50 text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-600/70 transition-all duration-200 text-sm border border-gray-500/30 flex items-center justify-center gap-2"
                                        >
                                            <span>🔗</span>
                                            View Repo
                                        </a>
                                    )}
                                </div>

                                {/* Additional Project Info */}
                                <div className="mt-4 pt-4 border-t border-gray-600/30">
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span>Last updated: 2 hours ago</span>
                                        <span>{project.team_members?.length || 0} active contributors</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'team' && (
                    <div className="space-y-6">
                        {/* Team Overview Section */}
                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <h3 className="text-2xl font-semibold mb-6 text-white">👥 Team Overview</h3>

                            {/* Team Statistics Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-100 text-sm">Total Members</p>
                                            <p className="text-2xl font-bold text-white">{dashboardData?.stats.total_team_members}</p>
                                        </div>
                                        <div className="text-3xl">👥</div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-green-100 text-sm">Active Projects</p>
                                            <p className="text-2xl font-bold text-white">{dashboardData?.stats.total_projects}</p>
                                        </div>
                                        <div className="text-3xl">🚀</div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-orange-100 text-sm">Avg Velocity</p>
                                            <p className="text-2xl font-bold text-white">{dashboardData?.stats.avg_velocity}%</p>
                                        </div>
                                        <div className="text-3xl">⚡</div>
                                    </div>
                                </div>
                            </div>

                            {/* Team Composition Chart */}
                            <div className="bg-dark-200/70 rounded-lg p-6 mb-6">
                                <h4 className="text-lg font-semibold mb-4 text-white">Team Composition by Role</h4>
                                <div className="w-full max-w-md mx-auto">
                                    <Doughnut
                                        data={{
                                            labels: ['Frontend', 'Backend', 'Mobile', 'DevOps', 'Design'],
                                            datasets: [{
                                                data: [2, 2, 1, 1, 2],
                                                backgroundColor: [
                                                    'rgba(59, 130, 246, 0.8)',
                                                    'rgba(16, 185, 129, 0.8)',
                                                    'rgba(245, 101, 101, 0.8)',
                                                    'rgba(251, 191, 36, 0.8)',
                                                    'rgba(139, 92, 246, 0.8)'
                                                ],
                                                borderColor: [
                                                    'rgb(59, 130, 246)',
                                                    'rgb(16, 185, 129)',
                                                    'rgb(245, 101, 101)',
                                                    'rgb(251, 191, 36)',
                                                    'rgb(139, 92, 246)'
                                                ],
                                                borderWidth: 2
                                            }]
                                        }}
                                        options={{
                                            responsive: true,
                                            plugins: {
                                                legend: {
                                                    labels: {
                                                        color: 'white'
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Team Performance Chart */}
                            <div className="bg-dark-200/70 rounded-lg p-6">
                                <h4 className="text-lg font-semibold mb-4 text-white">Team Performance by Project</h4>
                                <div className="w-full">
                                    <Bar
                                        data={{
                                            labels: dashboardData?.projects.map(p => p.name) || [],
                                            datasets: [
                                                {
                                                    label: 'Velocity %',
                                                    data: dashboardData?.projects.map(p => p.velocity) || [],
                                                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                                                    borderColor: 'rgb(59, 130, 246)',
                                                    borderWidth: 1
                                                },
                                                {
                                                    label: 'Quality %',
                                                    data: dashboardData?.projects.map(p => p.quality) || [],
                                                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                                                    borderColor: 'rgb(16, 185, 129)',
                                                    borderWidth: 1
                                                }
                                            ]
                                        }}
                                        options={{
                                            responsive: true,
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    max: 100,
                                                    ticks: {
                                                        color: 'white'
                                                    },
                                                    grid: {
                                                        color: 'rgba(255, 255, 255, 0.1)'
                                                    }
                                                },
                                                x: {
                                                    ticks: {
                                                        color: 'white'
                                                    },
                                                    grid: {
                                                        color: 'rgba(255, 255, 255, 0.1)'
                                                    }
                                                }
                                            },
                                            plugins: {
                                                legend: {
                                                    labels: {
                                                        color: 'white'
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Team Members Table */}
                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <h3 className="text-xl font-semibold mb-4 text-white">Team Members Directory</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-600">
                                            <th className="text-left py-3 px-4 text-gray-300">Name</th>
                                            <th className="text-left py-3 px-4 text-gray-300">Role</th>
                                            <th className="text-left py-3 px-4 text-gray-300">Projects</th>
                                            <th className="text-left py-3 px-4 text-gray-300">GitHub</th>
                                            <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dashboardData?.projects.flatMap(project =>
                                            project.team_members.map(member => (
                                                <tr key={`${project.id}-${member.id}`} className="border-b border-gray-700 hover:bg-dark-200/50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <p className="font-medium text-white">{member.name}</p>
                                                            <p className="text-sm text-gray-400">{member.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-xs border border-purple-500/30">
                                                            {member.project_role}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-sm text-gray-300">{project.name}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="text-sm text-gray-400">@{member.name.toLowerCase().replace(' ', '')}</span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <button className="text-purple-400 hover:text-purple-300 text-sm transition-colors">
                                                            View Profile
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'insights' && (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-xl p-6 text-white border border-gray-600/30">
                            <h3 className="text-2xl font-semibold mb-2">🧠 MCP-Powered AI Insights</h3>
                            <p className="opacity-90">
                                Get intelligent insights about your team collaboration, project health, and resource allocation using our advanced AI tools.
                            </p>
                        </div>

                        {mcpInsights ? (
                            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                                <h4 className="text-lg font-semibold mb-4 text-white">AI-Generated Team Insights</h4>
                                <div className="bg-dark-200/70 rounded-lg p-4">
                                    <pre className="whitespace-pre-wrap text-sm text-gray-300">{mcpInsights.preview}</pre>
                                </div>
                                <div className="mt-4 text-sm text-gray-400">
                                    Generated in {mcpInsights.execution_time}ms using {mcpInsights.tool}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-8 text-center">
                                <div className="text-6xl mb-4">🎯</div>
                                <h4 className="text-xl font-semibold text-white mb-2">No Insights Generated Yet</h4>
                                <p className="text-gray-300 mb-6">
                                    Click &quot;Generate AI Insights&quot; on any project card to get intelligent analysis of your team&apos;s collaboration patterns and project health.
                                </p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                                        <h5 className="font-semibold text-blue-300 mb-2">🔍 Team Collaboration</h5>
                                        <p className="text-sm text-blue-200">Analyze code review effectiveness, commit patterns, and team productivity</p>
                                    </div>
                                    <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4">
                                        <h5 className="font-semibold text-purple-300 mb-2">📊 Project Health</h5>
                                        <p className="text-sm text-purple-200">Get comprehensive project assessment and risk analysis</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* Performance Charts */}
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Team Velocity Trend */}
                            <div className="card">
                                <h4 className="text-lg font-semibold text-white mb-4">📈 Team Velocity Trend</h4>
                                <Line
                                    data={{
                                        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                                        datasets: [{
                                            label: 'Velocity %',
                                            data: [75, 80, 85, 82, 88, 85],
                                            borderColor: 'rgb(236, 72, 153)',
                                            backgroundColor: 'rgba(236, 72, 153, 0.1)',
                                            tension: 0.3
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

                            {/* Project Status Distribution */}
                            <div className="card">
                                <h4 className="text-lg font-semibold text-white mb-4">🎯 Project Status Distribution</h4>
                                <Doughnut
                                    data={{
                                        labels: ['Active', 'Planning', 'Completed', 'Paused'],
                                        datasets: [{
                                            data: [60, 25, 10, 5],
                                            backgroundColor: [
                                                'rgba(34, 197, 94, 0.8)',
                                                'rgba(251, 191, 36, 0.8)',
                                                'rgba(59, 130, 246, 0.8)',
                                                'rgba(239, 68, 68, 0.8)'
                                            ],
                                            borderColor: [
                                                'rgb(34, 197, 94)',
                                                'rgb(251, 191, 36)',
                                                'rgb(59, 130, 246)',
                                                'rgb(239, 68, 68)'
                                            ],
                                            borderWidth: 2
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        plugins: { legend: { labels: { color: 'white' } } }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Team Performance Bar Chart */}
                        <div className="card">
                            <h4 className="text-lg font-semibold text-white mb-4">👥 Team Performance Metrics</h4>
                            <Bar
                                data={{
                                    labels: ['Code Quality', 'Deployment Speed', 'Bug Resolution', 'Feature Delivery', 'Collaboration'],
                                    datasets: [{
                                        label: 'Team Average %',
                                        data: [88, 75, 92, 80, 95],
                                        backgroundColor: [
                                            'rgba(124, 58, 237, 0.8)',
                                            'rgba(236, 72, 153, 0.8)',
                                            'rgba(34, 197, 94, 0.8)',
                                            'rgba(251, 191, 36, 0.8)',
                                            'rgba(59, 130, 246, 0.8)'
                                        ],
                                        borderColor: [
                                            'rgb(124, 58, 237)',
                                            'rgb(236, 72, 153)',
                                            'rgb(34, 197, 94)',
                                            'rgb(251, 191, 36)',
                                            'rgb(59, 130, 246)'
                                        ],
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

                        {/* AI-Powered Analytics Actions */}
                        <div className="card">
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
                            <div className="card bg-gradient-to-r from-primary-600/20 via-cyber-600/20 to-primary-600/20 border border-primary-500/30">
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

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

type Repository = {
    id: string;
    repository_name: string;
    repository_url: string;
    description?: string;
    technology_stack?: string;
    primary_language?: string;
    is_primary: boolean;
    my_role?: string;
};

type Project = {
    id: string;
    name: string;
    description: string;
    status: string;
    priority: string;
    repository_url: string; // Legacy support
    created_at: string;
    updated_at: string;
    my_role: string;
    joined_at: string;
    team_count: number;
    repositories?: Repository[]; // New multi-repo support
};

type Activity = {
    activity_type: string;
    project_id: string;
    description: string;
    created_at: string;
};

type Skill = {
    skill_name: string;
    level: number;
    assessed_at: string;
};

type DashboardData = {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
    manager: {
        id: string;
        name: string;
        email: string;
        role: string;
    } | null;
    projects: Project[];
    activities: Activity[];
    stats: {
        total_projects: number;
        total_commits: number;
        avg_commits_per_week: number;
    };
    skills: Skill[];
};

export default function ProfessionalDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    // Check if user has professional role and redirect if not authenticated
    useEffect(() => {
        if (!user) {
            // For testing purposes, create a demo professional user
            console.log('No user found, creating demo professional user for testing');
            return;
        }
        if (user.role !== 'professional') {
            router.push('/dashboard');
            return;
        }
    }, [user, router]);

    const fetchDashboardData = useCallback(async () => {
        // Use demo professional user ID for testing when no user is logged in
        const userId = user?.id || '9c8c03dc-0abe-4448-87ef-ca19cda5caf7';

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/professional/dashboard/${userId}`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const data = await response.json();
            setDashboardData(data);
            setError('');
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

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

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'frontend': return 'bg-blue-600/20 text-blue-300 border border-blue-500/30';
            case 'backend': return 'bg-green-600/20 text-green-300 border border-green-500/30';
            case 'fullstack': return 'bg-purple-600/20 text-purple-300 border border-purple-500/30';
            case 'devops': return 'bg-orange-600/20 text-orange-300 border border-orange-500/30';
            default: return 'bg-gray-600/20 text-gray-300 border border-gray-500/30';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getActivityIcon = (type: string) => {
        const icons: Record<string, string> = {
            'code_commit': '💾',
            'code_review': '👀',
            'bug_fix': '🐛',
            'feature_complete': '✨',
            'testing': '🧪',
            'deployment': '🚀',
            'meeting': '👥',
            'documentation': '📝',
            'code_refactor': '🔧',
            'performance': '⚡'
        };
        return icons[type] || '📋';
    };

    if (loading && !dashboardData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-white text-lg">Loading your professional dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <p className="text-white text-xl mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', name: 'Project Overview', icon: '📊' },
        { id: 'activity', name: 'Activity Timeline', icon: '📈' },
        { id: 'skills', name: 'Skills Profile', icon: '🎯' },
        { id: 'analytics', name: 'Performance Analytics', icon: '📉' },
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
                            <Link href="/dashboard" className="text-gray-300 hover:text-primary-400 transition-colors">
                                Main Dashboard
                            </Link>
                            <Link href="/profile" className="text-gray-300 hover:text-primary-400 transition-colors">
                                Profile
                            </Link>
                            <div className="flex items-center space-x-3">
                                <div className="text-2xl">👨‍💻</div>
                                <div>
                                    <div className="text-sm font-medium text-white">{dashboardData?.user?.name || 'Professional'}</div>
                                    <div className="text-xs text-gray-400">Professional</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8">
                {/* Demo Notice Banner */}
                {!user && (
                    <div className="mb-6 bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl">🔬</div>
                            <div>
                                <p className="text-amber-300 font-medium">Demo Mode - Professional Dashboard</p>
                                <p className="text-amber-200/80 text-sm">Showing sample data for &quot;Professional User&quot; - In production, this requires professional role authentication.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                👨‍💻 Professional Dashboard
                            </h1>
                            <p className="text-gray-300">
                                Welcome back, {dashboardData?.user.name}! Here&apos;s your development overview.
                            </p>
                        </div>
                        {dashboardData?.manager && (
                            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl border border-gray-600/30 p-4">
                                <p className="text-sm text-gray-400 mb-1">Reporting to</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-semibold">
                                            {dashboardData.manager.name.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{dashboardData.manager.name}</p>
                                        <p className="text-sm text-gray-400">{dashboardData.manager.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Active Projects</p>
                                    <p className="text-3xl font-bold">{dashboardData?.stats.total_projects}</p>
                                </div>
                                <div className="text-4xl opacity-80">🚀</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Total Commits</p>
                                    <p className="text-3xl font-bold">{dashboardData?.stats.total_commits}</p>
                                </div>
                                <div className="text-4xl opacity-80">💾</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Weekly Average</p>
                                    <p className="text-3xl font-bold">{dashboardData?.stats.avg_commits_per_week.toFixed(1)}</p>
                                </div>
                                <div className="text-4xl opacity-80">📈</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm">Skills Mastered</p>
                                    <p className="text-3xl font-bold">{dashboardData?.skills.length}</p>
                                </div>
                                <div className="text-4xl opacity-80">🎯</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-8">
                    <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl border border-gray-600/30 p-2">
                        <div className="flex flex-wrap gap-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === tab.id
                                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                                            : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
                                        }`}
                                >
                                    <span>{tab.icon}</span>
                                    {tab.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid lg:grid-cols-2 gap-6">
                        {dashboardData?.projects.map((project) => (
                            <div key={project.id} className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6 hover:bg-dark-100/60 transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold text-white mb-2">{project.name}</h3>
                                        <p className="text-gray-300 leading-relaxed mb-3">{project.description}</p>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm text-gray-400">Your role:</span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(project.my_role)}`}>
                                                {project.my_role.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 ml-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                            {project.status.toUpperCase()}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                                            {project.priority.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-dark-200/70 rounded-lg p-4 mb-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mb-2">
                                                <span className="text-2xl">👥</span>
                                            </div>
                                            <p className="text-xl font-bold text-blue-400">{project.team_count}</p>
                                            <p className="text-xs text-gray-400">Team Size</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mb-2">
                                                <span className="text-2xl">📅</span>
                                            </div>
                                            <p className="text-xl font-bold text-green-400">{formatDate(project.joined_at)}</p>
                                            <p className="text-xs text-gray-400">Joined Date</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Repositories Section */}
                                {project.repositories && project.repositories.length > 0 ? (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                                            <span>🗂️</span>
                                            Repositories ({project.repositories.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {project.repositories.map((repo) => (
                                                <div key={repo.id} className="bg-dark-200/50 rounded-lg p-3 border border-gray-600/20">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-white text-sm">{repo.repository_name}</span>
                                                            {repo.is_primary && (
                                                                <span className="bg-blue-600/20 text-blue-300 text-xs px-2 py-1 rounded border border-blue-500/30">
                                                                    PRIMARY
                                                                </span>
                                                            )}
                                                            {repo.my_role && (
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(repo.my_role)}`}>
                                                                    {repo.my_role.toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {repo.primary_language && (
                                                                <span className="bg-purple-600/20 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/30">
                                                                    {repo.primary_language}
                                                                </span>
                                                            )}
                                                            <a
                                                                href={repo.repository_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-400 hover:text-blue-300 text-sm"
                                                            >
                                                                🔗
                                                            </a>
                                                        </div>
                                                    </div>
                                                    {repo.description && (
                                                        <p className="text-xs text-gray-400">{repo.description}</p>
                                                    )}
                                                    {repo.technology_stack && (
                                                        <p className="text-xs text-gray-500 mt-1">Tech: {repo.technology_stack}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* Legacy single repository display */
                                    <div className="flex gap-3">
                                        {project.repository_url && (
                                            <a
                                                href={project.repository_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2"
                                            >
                                                <span>🔗</span>
                                                View Repository
                                            </a>
                                        )}
                                        <button className="bg-gray-600/50 text-gray-300 px-4 py-3 rounded-lg hover:bg-gray-600/70 transition-all duration-200 text-sm border border-gray-500/30 flex items-center justify-center gap-2">
                                            <span>📊</span>
                                            View Details
                                        </button>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-gray-600/30">
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span>Created: {formatDate(project.created_at)}</span>
                                        <span>Updated: {formatDate(project.updated_at)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                        <h3 className="text-2xl font-semibold mb-6 text-white flex items-center gap-3">
                            <span>📈</span>
                            Recent Activity Timeline
                        </h3>
                        <div className="space-y-4">
                            {dashboardData?.activities.map((activity, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 bg-dark-200/50 rounded-lg hover:bg-dark-200/70 transition-colors">
                                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white">
                                        {getActivityIcon(activity.activity_type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-white font-medium">{activity.description}</p>
                                            <span className="text-xs text-gray-400">{formatDate(activity.created_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(activity.activity_type)}`}>
                                                {activity.activity_type.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'skills' && (
                    <div className="space-y-6">
                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <h3 className="text-2xl font-semibold mb-6 text-white flex items-center gap-3">
                                <span>🎯</span>
                                Skills Portfolio
                            </h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Skills Chart */}
                                <div className="bg-dark-200/70 rounded-lg p-6">
                                    <h4 className="text-lg font-semibold mb-4 text-white">Skill Level Distribution</h4>
                                    <div className="w-full max-w-sm mx-auto">
                                        <Doughnut
                                            data={{
                                                labels: ['Expert (5)', 'Advanced (4)', 'Intermediate (3)', 'Beginner (2)', 'Learning (1)'],
                                                datasets: [{
                                                    data: [
                                                        dashboardData?.skills.filter(s => s.level === 5).length || 0,
                                                        dashboardData?.skills.filter(s => s.level === 4).length || 0,
                                                        dashboardData?.skills.filter(s => s.level === 3).length || 0,
                                                        dashboardData?.skills.filter(s => s.level === 2).length || 0,
                                                        dashboardData?.skills.filter(s => s.level === 1).length || 0
                                                    ],
                                                    backgroundColor: [
                                                        'rgba(16, 185, 129, 0.8)',
                                                        'rgba(59, 130, 246, 0.8)',
                                                        'rgba(251, 191, 36, 0.8)',
                                                        'rgba(245, 101, 101, 0.8)',
                                                        'rgba(139, 92, 246, 0.8)'
                                                    ],
                                                    borderColor: [
                                                        'rgb(16, 185, 129)',
                                                        'rgb(59, 130, 246)',
                                                        'rgb(251, 191, 36)',
                                                        'rgb(245, 101, 101)',
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

                                {/* Skills List */}
                                <div className="bg-dark-200/70 rounded-lg p-6">
                                    <h4 className="text-lg font-semibold mb-4 text-white">Detailed Skills</h4>
                                    <div className="space-y-3">
                                        {dashboardData?.skills.map((skill, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-dark-100/50 rounded-lg">
                                                <div>
                                                    <p className="text-white font-medium">{skill.skill_name}</p>
                                                    <p className="text-xs text-gray-400">Assessed {formatDate(skill.assessed_at)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className={`w-3 h-3 rounded-full ${i < skill.level
                                                                        ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                                                                        : 'bg-gray-600'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-sm text-gray-300 ml-2">{skill.level}/5</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                                <h4 className="text-lg font-semibold mb-4 text-white">Project Distribution</h4>
                                <div className="w-full max-w-sm mx-auto">
                                    <Doughnut
                                        data={{
                                            labels: dashboardData?.projects.map(p => p.name) || [],
                                            datasets: [{
                                                data: dashboardData?.projects.map(() => 1) || [],
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

                            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                                <h4 className="text-lg font-semibold mb-4 text-white">Role Distribution</h4>
                                <div className="w-full max-w-sm mx-auto">
                                    <Doughnut
                                        data={{
                                            labels: ['Frontend', 'Backend', 'Fullstack'],
                                            datasets: [{
                                                data: [
                                                    dashboardData?.projects.filter(p => p.my_role === 'frontend').length || 0,
                                                    dashboardData?.projects.filter(p => p.my_role === 'backend').length || 0,
                                                    dashboardData?.projects.filter(p => p.my_role === 'fullstack').length || 0
                                                ],
                                                backgroundColor: [
                                                    'rgba(59, 130, 246, 0.8)',
                                                    'rgba(16, 185, 129, 0.8)',
                                                    'rgba(139, 92, 246, 0.8)'
                                                ],
                                                borderColor: [
                                                    'rgb(59, 130, 246)',
                                                    'rgb(16, 185, 129)',
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
                        </div>

                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <h4 className="text-lg font-semibold mb-4 text-white">Performance Summary</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-400">{dashboardData?.stats.total_projects}</div>
                                    <div className="text-sm text-gray-400">Active Projects</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-400">{dashboardData?.stats.total_commits}</div>
                                    <div className="text-sm text-gray-400">Total Commits</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-purple-400">{dashboardData?.stats.avg_commits_per_week.toFixed(1)}</div>
                                    <div className="text-sm text-gray-400">Weekly Average</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-400">{dashboardData?.skills.length}</div>
                                    <div className="text-sm text-gray-400">Skills Tracked</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

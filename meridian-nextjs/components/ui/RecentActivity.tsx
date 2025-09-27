import React, { useState, useEffect, useCallback } from 'react'
import {
    GitBranch,
    GitPullRequest,
    GitCommit,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    User
} from 'lucide-react'

interface GitHubActivity {
    type: 'commit' | 'pull_request' | 'issue' | 'deployment'
    title: string
    description: string
    timestamp: string
    author: {
        name: string
        avatar_url: string
        login: string
    }
    status?: 'success' | 'failure' | 'pending' | 'open' | 'closed'
    url?: string
}

interface RecentActivityProps {
    repositoryFullName: string
    className?: string
}

export function RecentActivity({ repositoryFullName, className = '' }: RecentActivityProps) {
    const [activities, setActivities] = useState<GitHubActivity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchRecentActivity()
    }, [repositoryFullName])

    const fetchRecentActivity = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            // For now, we'll create mock data that looks realistic
            // In a real implementation, you would fetch from GitHub API
            const mockActivities: GitHubActivity[] = [
                {
                    type: 'commit',
                    title: 'feat: Add enhanced dashboard with dynamic metrics',
                    description: 'Implemented comprehensive dashboard with AI-driven insights and real-time scoring',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
                    author: {
                        name: 'Arnab Maity',
                        avatar_url: `https://github.com/itisaby.png`,
                        login: 'itisaby'
                    },
                    status: 'success',
                    url: `https://github.com/${repositoryFullName}/commit/abc123`
                },
                {
                    type: 'deployment',
                    title: 'Production Deployment',
                    description: 'Deployed to production environment successfully',
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
                    author: {
                        name: 'GitHub Actions',
                        avatar_url: 'https://github.com/github.png',
                        login: 'github-actions[bot]'
                    },
                    status: 'success'
                },
                {
                    type: 'pull_request',
                    title: 'Add comprehensive AI analysis features',
                    description: 'Implement dynamic scoring system and enhanced dashboard visualization',
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
                    author: {
                        name: 'Arnab Maity',
                        avatar_url: `https://github.com/itisaby.png`,
                        login: 'itisaby'
                    },
                    status: 'open',
                    url: `https://github.com/${repositoryFullName}/pull/42`
                },
                {
                    type: 'commit',
                    title: 'fix: Resolve API endpoint routing issues',
                    description: 'Fixed FastAPI path parameter handling for repository names with slashes',
                    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
                    author: {
                        name: 'Arnab Maity',
                        avatar_url: `https://github.com/itisaby.png`,
                        login: 'itisaby'
                    },
                    status: 'success'
                },
                {
                    type: 'issue',
                    title: 'Dashboard performance optimization needed',
                    description: 'Enhanced dashboard taking too long to load with multiple API calls',
                    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
                    author: {
                        name: 'Arnab Maity',
                        avatar_url: `https://github.com/itisaby.png`,
                        login: 'itisaby'
                    },
                    status: 'closed'
                },
                {
                    type: 'deployment',
                    title: 'Staging Deployment',
                    description: 'Failed to deploy to staging environment - CI/CD pipeline issues',
                    timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
                    author: {
                        name: 'GitHub Actions',
                        avatar_url: 'https://github.com/github.png',
                        login: 'github-actions[bot]'
                    },
                    status: 'failure'
                }
            ]

            setActivities(mockActivities)
        } catch (err) {
            setError('Failed to fetch recent activity')
            console.error('Error fetching activity:', err)
        } finally {
            setLoading(false)
        }
    }, [repositoryFullName])

    useEffect(() => {
        fetchRecentActivity()
    }, [fetchRecentActivity])

    const getActivityIcon = (type: string, status?: string) => {
        switch (type) {
            case 'commit':
                return <GitCommit className="w-4 h-4" />
            case 'pull_request':
                return <GitPullRequest className="w-4 h-4" />
            case 'issue':
                return <AlertCircle className="w-4 h-4" />
            case 'deployment':
                if (status === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />
                if (status === 'failure') return <XCircle className="w-4 h-4 text-red-500" />
                return <Clock className="w-4 h-4 text-yellow-500" />
            default:
                return <GitBranch className="w-4 h-4" />
        }
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'success': return 'text-green-500'
            case 'failure': return 'text-red-500'
            case 'pending': return 'text-yellow-500'
            case 'open': return 'text-blue-500'
            case 'closed': return 'text-purple-500'
            default: return 'text-gray-400'
        }
    }

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))

        if (diffInHours < 1) return 'Just now'
        if (diffInHours === 1) return '1 hour ago'
        if (diffInHours < 24) return `${diffInHours} hours ago`

        const diffInDays = Math.floor(diffInHours / 24)
        if (diffInDays === 1) return '1 day ago'
        if (diffInDays < 7) return `${diffInDays} days ago`

        return time.toLocaleDateString()
    }

    if (loading) {
        return (
            <div className={`bg-dark-100 rounded-lg p-6 ${className}`}>
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-700 rounded w-1/2 mt-2"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className={`bg-dark-100 rounded-lg p-6 ${className}`}>
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="text-center text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`bg-dark-100 rounded-lg p-6 ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <div className="text-right">
                    <div className="text-sm text-gray-400">
                        Last 24 hours
                    </div>
                </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
                {activities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 group hover:bg-dark-200/50 p-3 rounded-lg transition-colors">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={activity.author.avatar_url}
                                alt={activity.author.name}
                                className="w-8 h-8 rounded-full border border-gray-600"
                            />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                                <div className={getStatusColor(activity.status)}>
                                    {getActivityIcon(activity.type, activity.status)}
                                </div>
                                <span className="text-sm font-medium text-white truncate">
                                    {activity.title}
                                </span>
                            </div>

                            <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                                {activity.description}
                            </p>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                    <User className="w-3 h-3" />
                                    <span>{activity.author.name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTimeAgo(activity.timestamp)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status indicator */}
                        {activity.status && (
                            <div className="flex-shrink-0">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${activity.status === 'success' ? 'bg-green-500/20 text-green-400' :
                                        activity.status === 'failure' ? 'bg-red-500/20 text-red-400' :
                                            activity.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                activity.status === 'open' ? 'bg-blue-500/20 text-blue-400' :
                                                    activity.status === 'closed' ? 'bg-purple-500/20 text-purple-400' :
                                                        'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {activity.status}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {activities.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                    <GitBranch className="w-8 h-8 mx-auto mb-2" />
                    <p>No recent activity</p>
                </div>
            )}
        </div>
    )
}

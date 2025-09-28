import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { withAuth } from '../contexts/AuthContext'
import { TokenManager } from '../lib/tokenManager'
import { Github, TrendingUp, Star, GitFork, Code, Brain, Target } from 'lucide-react'

interface Repository {
    id: string
    name: string
    full_name: string
    description: string
    language: string
    stars: number
    forks: number
    updated_at: string
    private: boolean
}

interface AIAnalysis {
    repository_full_name: string
    devops_score: number
    created_at: string
}

interface GitHubStats {
    totalRepos: number
    publicRepos: number
    privateRepos: number
    totalStars: number
    totalForks: number
    languages: Record<string, number>
    analysedRepos: number
    avgDevOpsScore: number
    topAnalysedRepos: Array<{ name: string, score: number }>
}

function Dashboard() {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [githubStats, setGithubStats] = useState<GitHubStats | null>(null)
    const [loadingStats, setLoadingStats] = useState(true)

    // Check if user needs to complete profile setup
    useEffect(() => {
        if (user && (!user.role || user.role === 'developer')) {
            // Redirect to profile setup if no proper role is set
            router.push('/profile-setup')
        }
    }, [user, router])

    // Fetch GitHub overview stats
    useEffect(() => {
        const fetchGithubStats = async () => {
            try {
                setLoadingStats(true)

                // Fetch repositories and AI analyses in parallel
                const [reposResponse, analysesResponse] = await Promise.all([
                    fetch('/api/repositories/github/repos', {
                        headers: TokenManager.getAuthHeader()
                    }),
                    fetch('/api/ai/user-analyses', {
                        headers: TokenManager.getAuthHeader()
                    })
                ])

                let repositories: Repository[] = []
                let analyses: AIAnalysis[] = []

                if (reposResponse.ok) {
                    const reposData = await reposResponse.json()
                    repositories = reposData.repositories || []
                }

                if (analysesResponse.ok) {
                    const analysesData = await analysesResponse.json()
                    analyses = analysesData.analyses || []
                }

                // Calculate comprehensive stats
                const totalRepos = repositories.length
                const publicRepos = repositories.filter(r => !r.private).length
                const privateRepos = repositories.filter(r => r.private).length
                const totalStars = repositories.reduce((sum, repo) => sum + repo.stars, 0)
                const totalForks = repositories.reduce((sum, repo) => sum + repo.forks, 0)

                // Calculate language distribution
                const languages: Record<string, number> = {}
                repositories.forEach(repo => {
                    if (repo.language) {
                        languages[repo.language] = (languages[repo.language] || 0) + 1
                    }
                })

                // Calculate AI analysis stats
                const analysedRepos = analyses.length
                const avgDevOpsScore = analyses.length > 0
                    ? analyses.reduce((sum, analysis) => sum + analysis.devops_score, 0) / analyses.length
                    : 0

                const topAnalysedRepos = analyses
                    .sort((a, b) => b.devops_score - a.devops_score)
                    .slice(0, 3)
                    .map(analysis => ({
                        name: analysis.repository_full_name.split('/')[1] || analysis.repository_full_name,
                        score: analysis.devops_score
                    }))

                setGithubStats({
                    totalRepos,
                    publicRepos,
                    privateRepos,
                    totalStars,
                    totalForks,
                    languages,
                    analysedRepos,
                    avgDevOpsScore: Math.round(avgDevOpsScore),
                    topAnalysedRepos
                })

            } catch (error) {
                console.error('Error fetching GitHub stats:', error)
            } finally {
                setLoadingStats(false)
            }
        }

        fetchGithubStats()
    }, [])

    const handleLogout = async () => {
        await logout()
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'student': return '🎓'
            case 'professional': return '👨‍💻'
            case 'manager': return '👨‍💼'
            default: return '👤'
        }
    }

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'student': return 'Student'
            case 'professional': return 'Professional'
            case 'manager': return 'Manager'
            default: return 'User'
        }
    }

    return (
        <>
            <Head>
                <title>Dashboard - Meridian</title>
                <meta name="description" content="Your Meridian dashboard" />
            </Head>

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
                                    <div className="text-2xl">{getRoleIcon(user?.role || '')}</div>
                                    <div>
                                        <div className="text-sm font-medium text-white">{user?.name}</div>
                                        <div className="text-xs text-gray-400">{getRoleDisplayName(user?.role || '')}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="btn-secondary text-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Dashboard Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Welcome back, {user?.name}! 👋
                        </h1>
                        <p className="text-xl text-gray-300">
                            Ready to continue your DevOps journey as a {getRoleDisplayName(user?.role || '')}?
                        </p>
                    </div>

                    {/* AI Feature Spotlight */}
                    <div className="card p-8 mb-8 bg-gradient-to-r from-primary-600/20 via-cyber-600/20 to-primary-600/20 border border-primary-500/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="text-4xl">🤖</div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        AI-Powered DevOps Analysis
                                        <span className="ml-2 text-xs bg-cyber-500 text-white px-2 py-1 rounded-full">NEW</span>
                                    </h2>
                                    <p className="text-gray-300">
                                        Get personalized DevOps recommendations powered by Google Gemini AI
                                    </p>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <Link
                                    href="/repositories"
                                    className="btn-secondary flex items-center space-x-2"
                                >
                                    <span>📊</span>
                                    <span>View Repositories</span>
                                </Link>
                                <Link
                                    href="/enhanced-dashboard"
                                    className="btn-primary flex items-center space-x-2"
                                >
                                    <span>🚀</span>
                                    <span>Try AI Analysis</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* GitHub Overview Stats */}
                    <div className="card p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <Github className="w-8 h-8 text-gray-300" />
                                <h2 className="text-2xl font-bold text-white">GitHub Portfolio Overview</h2>
                            </div>
                            {loadingStats && (
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                            )}
                        </div>

                        {githubStats && !loadingStats ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Repository Stats */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                                        <Code className="w-5 h-5" />
                                        <span>Repository Statistics</span>
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-dark-100/50 rounded-lg p-4 text-center">
                                            <div className="text-2xl font-bold text-primary-400 mb-1">{githubStats.totalRepos}</div>
                                            <div className="text-xs text-gray-400">Total Repos</div>
                                        </div>
                                        <div className="bg-dark-100/50 rounded-lg p-4 text-center">
                                            <div className="text-2xl font-bold text-green-400 mb-1">{githubStats.publicRepos}</div>
                                            <div className="text-xs text-gray-400">Public</div>
                                        </div>
                                        <div className="bg-dark-100/50 rounded-lg p-4 text-center">
                                            <div className="text-2xl font-bold text-yellow-400 mb-1 flex items-center justify-center space-x-1">
                                                <Star className="w-4 h-4" />
                                                <span>{githubStats.totalStars}</span>
                                            </div>
                                            <div className="text-xs text-gray-400">Total Stars</div>
                                        </div>
                                        <div className="bg-dark-100/50 rounded-lg p-4 text-center">
                                            <div className="text-2xl font-bold text-blue-400 mb-1 flex items-center justify-center space-x-1">
                                                <GitFork className="w-4 h-4" />
                                                <span>{githubStats.totalForks}</span>
                                            </div>
                                            <div className="text-xs text-gray-400">Total Forks</div>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Analysis Stats */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                                        <Brain className="w-5 h-5" />
                                        <span>AI DevOps Analysis</span>
                                    </h3>
                                    <div className="bg-gradient-to-br from-primary-600/20 to-cyber-600/20 rounded-lg p-4 border border-primary-500/30">
                                        <div className="text-center mb-4">
                                            <div className="text-3xl font-bold text-primary-400 mb-1">{githubStats.avgDevOpsScore}/100</div>
                                            <div className="text-sm text-gray-300">Average DevOps Score</div>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                                            <div
                                                className={`h-2 rounded-full ${githubStats.avgDevOpsScore >= 80 ? 'bg-green-500' :
                                                    githubStats.avgDevOpsScore >= 60 ? 'bg-yellow-500' :
                                                        githubStats.avgDevOpsScore >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                                                style={{ width: `${githubStats.avgDevOpsScore}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>{githubStats.analysedRepos} analyzed</span>
                                            <span>{githubStats.totalRepos - githubStats.analysedRepos} pending</span>
                                        </div>
                                    </div>
                                    {githubStats.topAnalysedRepos.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-300 mb-2">Top Scoring Repositories</h4>
                                            <div className="space-y-1">
                                                {githubStats.topAnalysedRepos.map((repo, index) => (
                                                    <div key={index} className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-300 truncate">{repo.name}</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-12 bg-gray-700 rounded-full h-1">
                                                                <div
                                                                    className={`h-1 rounded-full ${repo.score >= 80 ? 'bg-green-500' :
                                                                        repo.score >= 60 ? 'bg-yellow-500' :
                                                                            repo.score >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                                                                    style={{ width: `${repo.score}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs text-primary-400 w-8">{repo.score}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Languages */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                                        <Target className="w-5 h-5" />
                                        <span>Technology Stack</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {Object.entries(githubStats.languages)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 6)
                                            .map(([language, count]) => {
                                                const percentage = Math.round((count / githubStats.totalRepos) * 100)
                                                return (
                                                    <div key={language} className="flex items-center justify-between">
                                                        <span className="text-gray-300 text-sm">{language}</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-16 bg-gray-700 rounded-full h-2">
                                                                <div
                                                                    className="bg-primary-500 h-2 rounded-full"
                                                                    style={{ width: `${percentage}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs text-primary-400 w-8">{count}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-600">
                                        <Link
                                            href="/repositories"
                                            className="w-full btn-secondary py-2 text-center block text-sm"
                                        >
                                            Analyze More Repositories →
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : !loadingStats ? (
                            <div className="text-center py-8">
                                <Github className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-white mb-2">Connect Your GitHub</h3>
                                <p className="text-gray-400 mb-4">Connect your GitHub account to see your repository analytics</p>
                                <Link href="/repositories" className="btn-primary">
                                    Connect GitHub
                                </Link>
                            </div>
                        ) : null}
                    </div>

                    {/* Quick Actions */}
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <Link href="/repositories" className="card p-6 hover:scale-105 transition-transform cursor-pointer group">
                            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📊</div>
                            <h3 className="text-xl font-bold text-white mb-2">My Repositories</h3>
                            <p className="text-gray-400">View and analyze your GitHub repositories</p>
                            <div className="mt-3 pt-3 border-t border-gray-600">
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{githubStats?.totalRepos || 0} repositories</span>
                                    <TrendingUp className="w-3 h-3" />
                                </div>
                            </div>
                        </Link>

                        <Link href="/enhanced-dashboard" className="card p-6 hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br from-primary-600 to-cyber-600 group">
                            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🚀</div>
                            <h3 className="text-xl font-bold text-white mb-2">Enhanced Dashboard</h3>
                            <p className="text-gray-300">Repository-specific AI-powered DevOps insights</p>
                            <div className="mt-3 pt-3 border-t border-primary-400/30">
                                <div className="flex items-center justify-between text-xs text-primary-200">
                                    <span>Avg Score: {githubStats?.avgDevOpsScore || 0}/100</span>
                                    <Brain className="w-3 h-3" />
                                </div>
                            </div>
                        </Link>

                        <Link href="/enhanced-dashboard?tab=learning-paths">
                            <div className="card p-6 hover:scale-105 transition-transform cursor-pointer group">
                                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🎯</div>
                                <h3 className="text-xl font-bold text-white mb-2">Learning Paths</h3>
                                <p className="text-gray-400">Personalized learning based on analysis results</p>
                                <div className="mt-3 pt-3 border-t border-gray-600">
                                    <div className="flex items-center justify-between text-xs text-primary-400">
                                        <span>Start Learning</span>
                                        <Target className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Team Collaboration - Only for Professionals and Managers */}
                        {user?.role !== 'student' && (
                            <div className="card p-6 hover:scale-105 transition-transform cursor-pointer group opacity-75">
                                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🤝</div>
                                <h3 className="text-xl font-bold text-white mb-2">Team Collaboration</h3>
                                <p className="text-gray-400">Share insights and collaborate with team members</p>
                                <div className="mt-3 pt-3 border-t border-gray-600">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>Coming Soon</span>
                                        <Github className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Role-Specific Content */}
                    {user?.role === 'student' && (
                        <div className="card p-8 mb-8">
                            <h2 className="text-2xl font-bold text-gradient mb-6">Your Learning Journey</h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Current Progress</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-300">Docker & Containers</span>
                                                <span className="text-primary-400">75%</span>
                                            </div>
                                            <div className="w-full bg-dark-200 rounded-full h-2">
                                                <div className="bg-primary-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-300">API Development</span>
                                                <span className="text-cyber-400">45%</span>
                                            </div>
                                            <div className="w-full bg-dark-200 rounded-full h-2">
                                                <div className="bg-cyber-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Next Steps</h3>
                                    <div className="space-y-2 text-sm text-gray-300">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                                            <span>Complete Kubernetes basics (30 min)</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-cyber-400 rounded-full"></div>
                                            <span>Practice with REST APIs (45 min)</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                                            <span>Join study group (Thu 2pm)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {user?.role === 'professional' && (
                        <div className="card p-8 mb-8">
                            <h2 className="text-2xl font-bold text-gradient mb-6">Development Insights</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-primary-400">12</div>
                                    <div className="text-sm text-gray-400">Issues Resolved</div>
                                    <div className="text-xs text-green-400 mt-1">↗ +20%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-cyber-400">4.2s</div>
                                    <div className="text-sm text-gray-400">Avg Debug Time</div>
                                    <div className="text-xs text-green-400 mt-1">↘ -65%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-400">98.9%</div>
                                    <div className="text-sm text-gray-400">System Uptime</div>
                                    <div className="text-xs text-green-400 mt-1">↗ +2.1%</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {user?.role === 'manager' && (
                        <div className="card p-8 mb-8">
                            <h2 className="text-2xl font-bold text-gradient mb-6">Team Performance</h2>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="text-center bg-dark-200/50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-primary-400">94%</div>
                                    <div className="text-sm text-gray-400">Team Health</div>
                                    <div className="text-xs text-green-400 mt-1">↗ +8%</div>
                                </div>
                                <div className="text-center bg-dark-200/50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-cyber-400">2.3x</div>
                                    <div className="text-sm text-gray-400">Velocity</div>
                                    <div className="text-xs text-green-400 mt-1">↗ +130%</div>
                                </div>
                                <div className="text-center bg-dark-200/50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-green-400">0.1%</div>
                                    <div className="text-sm text-gray-400">Incidents</div>
                                    <div className="text-xs text-green-400 mt-1">↘ -89%</div>
                                </div>
                                <div className="text-center bg-dark-200/50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-yellow-400">85%</div>
                                    <div className="text-sm text-gray-400">Capacity</div>
                                    <div className="text-xs text-yellow-400 mt-1">→ stable</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Coming Soon */}
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🚀</div>
                        <h2 className="text-2xl font-bold text-white mb-4">More Features Coming Soon!</h2>
                        <p className="text-gray-400 mb-6">
                            We&apos;re working hard to bring you repository analysis, AI-powered insights{user?.role !== 'student' ? ', and team collaboration features' : ' and enhanced learning features'}.
                        </p>
                        <Link href="/">
                            <button className="btn-primary">
                                Back to Homepage
                            </button>
                        </Link>
                    </div>
                </main>
            </div>
        </>
    )
}

export default withAuth(Dashboard)

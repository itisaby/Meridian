import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { withAuth, useAuth } from '../contexts/AuthContext'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { AnalysisModal } from '../components/ui/AnalysisModal'
import { AnalysisChart } from '../components/ui/AnalysisChart'
import { RecentActivity } from '../components/ui/RecentActivity'
import LearningPaths from '../components/ui/LearningPaths'
import { TokenManager } from '../lib/tokenManager'
import {
    Github,
    TrendingUp,
    Shield,
    GitBranch,
    Clock,
    Target,
    Zap,
    BookOpen,
    Award,
    Brain
} from 'lucide-react'

interface AnalysisHistoryData {
    analysis_number: number
    overall_score: number
    ci_cd_score: number
    security_score: number
    documentation_score: number
    automation_score: number
    analysis_date: string
    persona_used: string
}

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
    html_url: string
}

interface DevOpsMetrics {
    overall_score: number
    ci_cd_score: number
    security_score: number
    documentation_score: number
    automation_score: number
    repositories_analyzed: number
    total_repositories: number
}

interface AISuggestion {
    category: string
    priority: 'Critical' | 'High' | 'Medium' | 'Low'
    title: string
    description: string
    implementation_steps: string[]
    resources: string[]
    estimated_effort: string
    business_impact: string
}

interface AIInsights {
    persona: string
    devops_score: number
    suggestions: AISuggestion[]
    analysis_summary: string
    generated_at: string
}

function EnhancedDashboard() {
    const router = useRouter()
    const { user } = useAuth()
    const [repositories, setRepositories] = useState<Repository[]>([])
    const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
    const [metrics, setMetrics] = useState<DevOpsMetrics | null>(null)
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
    const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryData[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPersona, setSelectedPersona] = useState<'Student' | 'Professional' | 'Manager'>('Professional')
    const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'overview' | 'learning-paths' | 'analytics' | 'repositories'>('overview')

    // Handle URL tab parameter
    useEffect(() => {
        if (router.query.tab) {
            const tab = router.query.tab as string
            if (['overview', 'learning-paths', 'analytics', 'repositories'].includes(tab)) {
                setActiveTab(tab as 'overview' | 'learning-paths' | 'analytics' | 'repositories')
            }
        }
    }, [router.query.tab])

    // Set persona based on user role
    useEffect(() => {
        if (user?.role) {
            switch (user.role) {
                case 'student':
                    setSelectedPersona('Student')
                    break
                case 'manager':
                    setSelectedPersona('Manager')
                    break
                case 'professional':
                default:
                    setSelectedPersona('Professional')
                    break
            }
        }
    }, [user])

    useEffect(() => {
        fetchDashboardData()
    }, [router.query.repo]) // eslint-disable-line react-hooks/exhaustive-deps

    const openAnalysisModal = () => {
        setIsAnalysisModalOpen(true)
    }

    const fetchAnalysisHistory = async (repoFullName: string) => {
        try {
            const response = await fetch(`/api/ai/analysis-history?repo=${encodeURIComponent(repoFullName)}`, {
                headers: TokenManager.getAuthHeader()
            })

            if (response.ok) {
                const data = await response.json()
                setAnalysisHistory(data.history || [])
            }
        } catch (error) {
            console.error('Error fetching analysis history:', error)
        }
    }

    const closeAnalysisModal = () => {
        setIsAnalysisModalOpen(false)
    }

    const handleAnalysisComplete = () => {
        // Refresh dashboard data after analysis completion
        fetchDashboardData()
        setIsAnalysisModalOpen(false)
    }

    useEffect(() => {
        fetchDashboardData()
    }, [router.query.repo]) // eslint-disable-line react-hooks/exhaustive-deps

    const fetchDashboardData = async () => {
        try {
            setLoading(true)

            // Check if we're looking at a specific repository
            const targetRepo = router.query.repo as string

            if (targetRepo) {
                // Fetch enhanced dashboard data for specific repository
                const dashboardResponse = await fetch(`/api/ai/enhanced-dashboard?repo=${encodeURIComponent(targetRepo)}`, {
                    headers: TokenManager.getAuthHeader()
                })

                if (dashboardResponse.ok) {
                    const dashboardData = await dashboardResponse.json()

                    // Set metrics from the enhanced response
                    setMetrics(dashboardData.metrics)

                    // Set AI insights if analysis exists
                    if (dashboardData.analysis) {
                        setAiInsights({
                            persona: dashboardData.analysis.persona_used || selectedPersona,
                            devops_score: dashboardData.analysis.devops_score || 0,
                            suggestions: dashboardData.analysis.suggestions || [],
                            analysis_summary: dashboardData.analysis.analysis_summary || 'Analysis completed',
                            generated_at: dashboardData.analysis_date || new Date().toISOString()
                        })
                    } else {
                        // No analysis available, use basic metrics from repository data
                        const repoData = dashboardData.repository_data
                        if (repoData) {
                            setMetrics(calculateBasicMetrics(repoData))
                        }

                        setAiInsights({
                            persona: selectedPersona,
                            devops_score: 0,
                            suggestions: [],
                            analysis_summary: 'No AI analysis available. Run an analysis to see detailed insights.',
                            generated_at: new Date().toISOString()
                        })
                    }

                    // Fetch analysis history
                    await fetchAnalysisHistory(targetRepo)
                }
            }

            // Fetch repositories for the dropdown
            const reposResponse = await fetch('/api/repositories/github/repos', {
                headers: TokenManager.getAuthHeader()
            })

            if (reposResponse.ok) {
                const reposData = await reposResponse.json()
                const repositories: Repository[] = reposData.repositories || []
                setRepositories(repositories)

                // Find the specific repository if requested
                let repoForAnalysis: Repository | null = null
                if (targetRepo && repositories.length > 0) {
                    repoForAnalysis = repositories.find(
                        (repo: Repository) => repo.full_name === targetRepo
                    ) || null

                    if (repoForAnalysis) {
                        setSelectedRepository(repoForAnalysis)
                    }
                } else if (repositories.length > 0 && !targetRepo) {
                    // Default to first repository if no specific repo requested
                    repoForAnalysis = repositories[0]
                    setSelectedRepository(repoForAnalysis)
                    // Update URL to reflect the default repository selection
                    router.replace(`/enhanced-dashboard?repo=${encodeURIComponent(repoForAnalysis.full_name)}`)
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
            // Fallback to basic display
            setAiInsights({
                persona: selectedPersona,
                devops_score: 0,
                suggestions: [],
                analysis_summary: 'Unable to load dashboard data. Please try again later.',
                generated_at: new Date().toISOString()
            })
        } finally {
            setLoading(false)
        }
    }

    const calculateBasicMetrics = (repo: Repository): DevOpsMetrics => {
        // Basic scoring for repositories without AI analysis
        let ci_cd_score = 0
        let security_score = 0
        let documentation_score = 0
        let automation_score = 0

        // Basic heuristics based on repository characteristics
        if (repo.language === 'TypeScript' || repo.language === 'JavaScript') {
            ci_cd_score = 20
            automation_score = 15
        }
        if (repo.language === 'Python') {
            ci_cd_score = 15
            automation_score = 20
        }

        if (!repo.private) {
            security_score = 10
        }
        if (repo.stars > 5) {
            security_score += 10
        }

        if (repo.description && repo.description.length > 20) {
            documentation_score = 25
        }

        const overall = Math.round((ci_cd_score + security_score + documentation_score + automation_score) / 4)

        return {
            overall_score: overall,
            ci_cd_score,
            security_score,
            documentation_score,
            automation_score,
            repositories_analyzed: 0,
            total_repositories: 1
        }
    }

    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-400'
        if (score >= 60) return 'text-yellow-400'
        if (score >= 40) return 'text-orange-400'
        return 'text-red-400'
    }

    const getScoreBgColor = (score: number): string => {
        if (score >= 80) return 'bg-green-500'
        if (score >= 60) return 'bg-yellow-500'
        if (score >= 40) return 'bg-orange-500'
        return 'bg-red-500'
    }

    const getPriorityColor = (priority: string): string => {
        switch (priority) {
            case 'Critical': return 'bg-red-500/20 text-red-300'
            case 'High': return 'bg-orange-500/20 text-orange-300'
            case 'Medium': return 'bg-yellow-500/20 text-yellow-300'
            case 'Low': return 'bg-green-500/20 text-green-300'
            default: return 'bg-gray-500/20 text-gray-300'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading your DevOps insights...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <Head>
                <title>Enhanced Dashboard - Meridian</title>
                <meta name="description" content="AI-powered DevOps insights and metrics" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200">
                <div className="container mx-auto px-4 py-8">
                    {/* Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <Breadcrumb items={[
                            { label: 'Enhanced Dashboard', icon: '🚀' },
                            ...(selectedRepository ? [{ label: selectedRepository.name, icon: '📁' }] : [])
                        ]} />
                        <Link
                            href="/repositories"
                            className="btn-secondary flex items-center space-x-2"
                        >
                            <Github className="w-4 h-4" />
                            <span>My Repositories</span>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                🚀 DevOps Command Center
                            </h1>
                            <p className="text-gray-300">
                                AI-powered insights for your development workflow
                                {selectedRepository && (
                                    <span className="block text-primary-400 text-sm mt-1">
                                        Analyzing: {selectedRepository.full_name}
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center space-x-4">
                            {/* Repository Selector */}
                            {repositories.length > 0 && (
                                <div className="flex items-center space-x-2">
                                    <span className="text-gray-300 text-sm">Repository:</span>
                                    <select
                                        value={selectedRepository?.full_name || (repositories[0]?.full_name || '')}
                                        onChange={(e) => {
                                            const repoName = e.target.value
                                            if (repoName) {
                                                router.push(`/enhanced-dashboard?repo=${encodeURIComponent(repoName)}`)
                                            }
                                        }}
                                        className="bg-dark-100 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 max-w-48"
                                    >
                                        {repositories.map(repo => (
                                            <option key={repo.id} value={repo.full_name}>
                                                {repo.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Re-analyze Button */}
                            {selectedRepository && (
                                <button
                                    onClick={() => openAnalysisModal()}
                                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all flex items-center space-x-2 text-sm"
                                    title="Re-analyze this repository with fresh AI insights"
                                >
                                    <Brain className="w-4 h-4" />
                                    <span>🔄 Re-analyze</span>
                                </button>
                            )}

                            {/* Role-based Analysis Context */}
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-300 text-sm">Analyzed as:</span>
                                <div className="bg-dark-100 border border-gray-600 rounded-lg px-3 py-2 text-white flex items-center space-x-2">
                                    <span>
                                        {selectedPersona === 'Student' && '🎓 Student'}
                                        {selectedPersona === 'Professional' && '👨‍💻 Professional'}
                                        {selectedPersona === 'Manager' && '👨‍💼 Manager'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        (based on your profile)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabbed Navigation */}
                    <div className="mb-8">
                        <div className="flex space-x-8 border-b border-gray-600">
                            {[
                                { id: 'overview', label: '📊 Overview', icon: TrendingUp },
                                { id: 'learning-paths', label: '🎓 Learning Paths', icon: BookOpen },
                                { id: 'analytics', label: '📈 Analytics', icon: Brain },
                                { id: 'repositories', label: '📁 Repositories', icon: Github }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as 'overview' | 'learning-paths' | 'analytics' | 'repositories')}
                                    className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-primary-500 text-primary-400'
                                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'overview' && (
                        <div>
                            {/* Metrics Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <Target className="w-6 h-6 text-primary-400" />
                                    <h3 className="text-lg font-semibold text-white">Overall Score</h3>
                                </div>
                                <span className={`text-2xl font-bold ${getScoreColor(metrics?.overall_score || 0)}`}>
                                    {metrics?.overall_score || 0}
                                </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${getScoreBgColor(metrics?.overall_score || 0)}`}
                                    style={{ width: `${metrics?.overall_score || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <GitBranch className="w-6 h-6 text-blue-400" />
                                    <h3 className="text-lg font-semibold text-white">CI/CD</h3>
                                </div>
                                <span className={`text-2xl font-bold ${getScoreColor(metrics?.ci_cd_score || 0)}`}>
                                    {metrics?.ci_cd_score || 0}
                                </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${getScoreBgColor(metrics?.ci_cd_score || 0)}`}
                                    style={{ width: `${metrics?.ci_cd_score || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <Shield className="w-6 h-6 text-green-400" />
                                    <h3 className="text-lg font-semibold text-white">Security</h3>
                                </div>
                                <span className={`text-2xl font-bold ${getScoreColor(metrics?.security_score || 0)}`}>
                                    {metrics?.security_score || 0}
                                </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${getScoreBgColor(metrics?.security_score || 0)}`}
                                    style={{ width: `${metrics?.security_score || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <BookOpen className="w-6 h-6 text-purple-400" />
                                    <h3 className="text-lg font-semibold text-white">Documentation</h3>
                                </div>
                                <span className={`text-2xl font-bold ${getScoreColor(metrics?.documentation_score || 0)}`}>
                                    {metrics?.documentation_score || 0}
                                </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${getScoreBgColor(metrics?.documentation_score || 0)}`}
                                    style={{ width: `${metrics?.documentation_score || 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Analysis Chart and Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Analysis Score Trends Chart */}
                        <div className="lg:col-span-2">
                            <AnalysisChart data={analysisHistory} />
                        </div>

                        {/* Recent Activity */}
                        <div className="lg:col-span-1">
                            <RecentActivity
                                repositoryFullName={selectedRepository?.full_name || ''}
                            />
                        </div>
                    </div>

                    {/* AI Insights Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* AI Suggestions */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-2 mb-6">
                                <Zap className="w-6 h-6 text-yellow-400" />
                                <h2 className="text-xl font-bold text-white">AI-Powered Suggestions</h2>
                                <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-1 rounded">
                                    Powered by Gemini AI
                                </span>
                            </div>

                            {aiInsights && (
                                <div className="space-y-4">
                                    <div className="bg-dark-100/50 rounded-lg p-4">
                                        <p className="text-gray-300 text-sm mb-2">Analysis Summary</p>
                                        <p className="text-white">{aiInsights.analysis_summary}</p>
                                    </div>

                                    {aiInsights.suggestions.slice(0, 3).map((suggestion, index) => (
                                        <div key={index} className="bg-dark-100/30 rounded-lg p-4 border-l-4 border-primary-500">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="text-white font-semibold">{suggestion.title}</h4>
                                                <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(suggestion.priority)}`}>
                                                    {suggestion.priority}
                                                </span>
                                            </div>
                                            <p className="text-gray-300 text-sm mb-3">{suggestion.description}</p>
                                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{suggestion.estimated_effort}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Award className="w-3 h-3" />
                                                    <span>{suggestion.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button className="w-full btn-secondary py-2">
                                        View All AI Suggestions ({aiInsights.suggestions.length})
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Repository Overview */}
                        <div className="card p-6">
                            <div className="flex items-center space-x-2 mb-6">
                                <Github className="w-6 h-6 text-gray-300" />
                                <h2 className="text-xl font-bold text-white">
                                    {selectedRepository ? 'Repository Details' : 'Repository Health'}
                                </h2>
                            </div>

                            {selectedRepository ? (
                                /* Single Repository View */
                                <div className="space-y-4">
                                    <div className="bg-gradient-to-r from-primary-600/20 to-cyber-600/20 rounded-lg p-4">
                                        <h3 className="text-lg font-semibold text-white mb-2">{selectedRepository.name}</h3>
                                        <p className="text-gray-300 text-sm mb-3">{selectedRepository.description || 'No description available'}</p>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <div className="text-xl font-bold text-primary-400 mb-1">{selectedRepository.stars}</div>
                                                <div className="text-xs text-gray-400">Stars</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xl font-bold text-green-400 mb-1">{selectedRepository.forks}</div>
                                                <div className="text-xs text-gray-400">Forks</div>
                                            </div>
                                            <div className="text-center">
                                                <div className={`text-xl font-bold mb-1 ${getScoreColor(aiInsights?.devops_score || 0)}`}>
                                                    {aiInsights?.devops_score || 0}/100
                                                </div>
                                                <div className="text-xs text-gray-400">AI DevOps Score</div>
                                            </div>
                                        </div>
                                        {aiInsights && aiInsights.devops_score > 0 && (
                                            <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                                                <div
                                                    className={`h-2 rounded-full ${getScoreBgColor(aiInsights.devops_score)}`}
                                                    style={{ width: `${aiInsights.devops_score}%` }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-center justify-between bg-dark-100/50 rounded-lg p-3">
                                            <span className="text-gray-300 text-sm">Language</span>
                                            <span className="text-primary-400 text-sm">{selectedRepository.language || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between bg-dark-100/50 rounded-lg p-3">
                                            <span className="text-gray-300 text-sm">Visibility</span>
                                            <span className={`text-sm ${selectedRepository.private ? 'text-yellow-400' : 'text-green-400'}`}>
                                                {selectedRepository.private ? 'Private' : 'Public'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between bg-dark-100/50 rounded-lg p-3">
                                            <span className="text-gray-300 text-sm">Last Updated</span>
                                            <span className="text-gray-400 text-sm">{new Date(selectedRepository.updated_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* All Repositories View */
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-dark-100/50 rounded-lg p-4 text-center">
                                            <div className="text-2xl font-bold text-primary-400 mb-1">
                                                {repositories.length}
                                            </div>
                                            <div className="text-xs text-gray-400">Total Repositories</div>
                                        </div>
                                        <div className="bg-dark-100/50 rounded-lg p-4 text-center">
                                            <div className="text-2xl font-bold text-green-400 mb-1">
                                                {repositories.filter(r => r.language).length}
                                            </div>
                                            <div className="text-xs text-gray-400">Active Projects</div>
                                        </div>
                                    </div>

                                    {/* Top Languages */}
                                    <div>
                                        <h4 className="text-white font-semibold mb-3">Top Languages</h4>
                                        <div className="space-y-2">
                                            {Object.entries(
                                                repositories.reduce((acc, repo) => {
                                                    if (repo.language) {
                                                        acc[repo.language] = (acc[repo.language] || 0) + 1
                                                    }
                                                    return acc
                                                }, {} as Record<string, number>)
                                            ).slice(0, 5).map(([language, count]) => (
                                                <div key={language} className="flex items-center justify-between">
                                                    <span className="text-gray-300 text-sm">{language}</span>
                                                    <span className="text-primary-400 text-sm">{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="pt-4 border-t border-gray-600">
                                        <Link href="/repositories" className="w-full btn-secondary py-2 text-center block">
                                            View All Repositories
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Learning Paths Section */}
                        </div>
                    )}

                    {activeTab === 'learning-paths' && (
                        <div>
                            <div className="mb-8">
                                <div className="card p-6">
                                    <div className="flex items-center space-x-2 mb-6">
                                        <BookOpen className="w-6 h-6 text-blue-400" />
                                        <h2 className="text-xl font-bold text-white">Personalized Learning Paths</h2>
                                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                            AI-Powered Education
                                        </span>
                                    </div>
                                    <LearningPaths 
                                        userId={user?.id || 'demo-user'} 
                                        repositoryName={router.query.repo as string}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div>
                            {/* Analysis Chart and Recent Activity */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                                {/* Analysis Score Trends Chart */}
                                <div className="lg:col-span-2">
                                    <AnalysisChart data={analysisHistory} />
                                </div>

                                {/* Recent Activity */}
                                <div className="lg:col-span-1">
                                    <RecentActivity 
                                        repositoryFullName={selectedRepository?.full_name || ''} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'repositories' && (
                        <div>
                            {/* Repository Management */}
                            <div className="card p-6">
                                <div className="flex items-center space-x-2 mb-6">
                                    <Github className="w-6 h-6 text-gray-300" />
                                    <h2 className="text-xl font-bold text-white">Repository Management</h2>
                                </div>

                                <div className="space-y-4">
                                    {repositories.slice(0, 10).map((repo) => (
                                        <div key={repo.id} className="flex items-center justify-between py-3 border-b border-gray-600 last:border-b-0">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                <div>
                                                    <h4 className="text-white font-medium">{repo.name}</h4>
                                                    <p className="text-gray-400 text-sm">
                                                        {repo.description || 'No description'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-gray-400 text-sm">
                                                    Updated {new Date(repo.updated_at).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                    {repo.language && (
                                                        <span className="flex items-center space-x-1">
                                                            <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                                                            <span>{repo.language}</span>
                                                        </span>
                                                    )}
                                                    <span>⭐ {repo.stars}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Analysis Modal */}
            <AnalysisModal
                isOpen={isAnalysisModalOpen}
                onClose={closeAnalysisModal}
                repository={selectedRepository}
                onAnalysisComplete={handleAnalysisComplete}
            />
        </>
    )
}

export default withAuth(EnhancedDashboard)

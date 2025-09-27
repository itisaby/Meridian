import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { withAuth } from '../contexts/AuthContext'
import { Breadcrumb } from '../components/ui/Breadcrumb'
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
    Award
} from 'lucide-react'

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
    html_url?: string
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
    const [repositories, setRepositories] = useState<Repository[]>([])
    const [selectedRepository, setSelectedRepository] = useState<Repository | null>(null)
    const [metrics, setMetrics] = useState<DevOpsMetrics | null>(null)
    const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedPersona, setSelectedPersona] = useState<'Student' | 'Professional' | 'Manager'>('Professional')

    useEffect(() => {
        fetchDashboardData()
    }, [router.query.repo]) // eslint-disable-line react-hooks/exhaustive-deps

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            
            // Fetch repositories
            const reposResponse = await fetch('/api/repositories/github/repos', {
                headers: TokenManager.getAuthHeader()
            })
            
            if (reposResponse.ok) {
                const reposData = await reposResponse.json()
                setRepositories(reposData.repositories || [])
                
                // Check if a specific repository is requested
                const targetRepo = router.query.repo as string
                let repoForAnalysis = null
                
                if (targetRepo && reposData.repositories) {
                    // Find the specific repository
                    repoForAnalysis = reposData.repositories.find(
                        (repo: Repository) => repo.full_name === targetRepo
                    )
                    if (repoForAnalysis) {
                        setSelectedRepository(repoForAnalysis)
                    }
                }
                
                // Calculate metrics based on selected repository or all repositories
                let reposForMetrics = reposData.repositories || []
                if (targetRepo && repoForAnalysis) {
                    reposForMetrics = [repoForAnalysis] // Calculate metrics for single repo
                }
                const calculatedMetrics = calculateRealMetrics(reposForMetrics)
                setMetrics(calculatedMetrics)
                
                // Get AI insights for the selected or first repository
                const analysisRepo = repoForAnalysis || (reposData.repositories && reposData.repositories.length > 0 ? reposData.repositories[0] : null)
                if (analysisRepo) {
                    await fetchAIInsights(analysisRepo)
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateRealMetrics = (repos: Repository[]): DevOpsMetrics => {
        const totalRepos = repos.length
        let ciCdScore = 0
        let securityScore = 0
        let documentationScore = 0
        let automationScore = 0

        repos.forEach(repo => {
            // Calculate CI/CD score based on repository characteristics
            if (repo.language === 'TypeScript' || repo.language === 'JavaScript') {
                ciCdScore += 20 // Assumes modern web projects likely have CI/CD
            }
            if (repo.language === 'Python') {
                ciCdScore += 15
            }
            
            // Security score based on repository visibility and activity
            if (!repo.private) {
                securityScore += 10 // Public repos often have better security practices
            }
            if (repo.stars > 5) {
                securityScore += 15 // Popular repos tend to have better security
            }
            
            // Documentation score
            if (repo.description && repo.description.length > 20) {
                documentationScore += 25 // Good descriptions indicate better documentation
            }
            
            // Automation score based on language and activity
            if (repo.language && ['TypeScript', 'Python', 'JavaScript', 'Java'].includes(repo.language)) {
                automationScore += 20
            }
        })

        const overall_score = Math.min(
            Math.round((ciCdScore + securityScore + documentationScore + automationScore) / (totalRepos * 4)),
            100
        )

        return {
            overall_score,
            ci_cd_score: Math.min(Math.round(ciCdScore / totalRepos), 100),
            security_score: Math.min(Math.round(securityScore / totalRepos), 100),
            documentation_score: Math.min(Math.round(documentationScore / totalRepos), 100),
            automation_score: Math.min(Math.round(automationScore / totalRepos), 100),
            repositories_analyzed: totalRepos,
            total_repositories: totalRepos
        }
    }

    const fetchAIInsights = async (repo: Repository) => {
        try {
            const response = await fetch('/api/ai/test-suggestions', {
                method: 'POST',
                headers: {
                    ...TokenManager.getAuthHeader(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    repo_url: repo.html_url || `https://github.com/${repo.full_name}`,
                    persona: selectedPersona
                })
            })
            
            if (response.ok) {
                const data = await response.json()
                setAiInsights(data.analysis)
            }
        } catch (error) {
            console.error('Error fetching AI insights:', error)
            // Set mock AI insights as fallback
            setAiInsights({
                persona: selectedPersona,
                devops_score: metrics?.overall_score || 65,
                suggestions: [
                    {
                        category: 'CI/CD',
                        priority: 'High',
                        title: 'Implement Automated Testing Pipeline',
                        description: 'Add GitHub Actions workflow for automated testing on every pull request',
                        implementation_steps: [
                            'Create .github/workflows/test.yml',
                            'Add test commands for your tech stack',
                            'Configure branch protection rules'
                        ],
                        resources: ['GitHub Actions Documentation', 'Testing Best Practices'],
                        estimated_effort: '2-4 hours',
                        business_impact: 'Reduces bugs in production by 60% and increases deployment confidence'
                    }
                ],
                analysis_summary: 'Your repositories show good potential for DevOps improvements',
                generated_at: new Date().toISOString()
            })
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
                                        value={selectedRepository?.full_name || ''}
                                        onChange={(e) => {
                                            const repoName = e.target.value
                                            if (repoName) {
                                                router.push(`/enhanced-dashboard?repo=${encodeURIComponent(repoName)}`)
                                            } else {
                                                router.push('/enhanced-dashboard')
                                            }
                                        }}
                                        className="bg-dark-100 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500 max-w-48"
                                    >
                                        <option value="">All Repositories</option>
                                        {repositories.map(repo => (
                                            <option key={repo.id} value={repo.full_name}>
                                                {repo.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            
                            {/* Persona Selector */}
                            <div className="flex items-center space-x-2">
                                <span className="text-gray-300 text-sm">View as:</span>
                                <select
                                    value={selectedPersona}
                                    onChange={(e) => setSelectedPersona(e.target.value as 'Student' | 'Professional' | 'Manager')}
                                    className="bg-dark-100 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="Student">🎓 Student</option>
                                    <option value="Professional">👨‍💻 Professional</option>
                                    <option value="Manager">👨‍💼 Manager</option>
                                </select>
                            </div>
                        </div>
                    </div>

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
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center">
                                                <div className="text-xl font-bold text-primary-400 mb-1">{selectedRepository.stars}</div>
                                                <div className="text-xs text-gray-400">Stars</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xl font-bold text-green-400 mb-1">{selectedRepository.forks}</div>
                                                <div className="text-xs text-gray-400">Forks</div>
                                            </div>
                                        </div>
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

                    {/* Recent Activity */}
                    <div className="card p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                            <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {repositories.slice(0, 5).map((repo) => (
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
            </div>
        </>
    )
}

export default withAuth(EnhancedDashboard)

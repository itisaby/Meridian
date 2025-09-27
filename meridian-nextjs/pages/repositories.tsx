import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { withAuth } from '../contexts/AuthContext'
import { TokenManager } from '../lib/tokenManager'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { Github, Plus, Clock, Star, GitFork, AlertCircle, CheckCircle, X } from 'lucide-react'

interface Repository {
    id: string
    name: string
    full_name: string
    description: string
    clone_url: string
    html_url: string
    language: string
    stars: number
    forks: number
    updated_at: string
    private: boolean
}

interface AnalyzedRepository {
    id: string
    user_id: string
    repo_url: string
    repo_name: string
    analysis_data: any // TODO: Create proper analysis data type
    created_at: string
}

function RepositoriesPage() {
    const [githubRepos, setGithubRepos] = useState<Repository[]>([])
    const [analyzedRepos, setAnalyzedRepos] = useState<AnalyzedRepository[]>([])
    const [loading, setLoading] = useState(true)
    const [syncLoading, setSyncLoading] = useState(false)
    const [analyzingRepos, setAnalyzingRepos] = useState<Set<string>>(new Set())
    const [error, setError] = useState('')

    useEffect(() => {
        fetchRepositories()
    }, [])

    const fetchRepositories = async () => {
        try {
            setLoading(true)
            
            // Fetch GitHub repositories and analyzed repositories in parallel
            const [githubResponse, analyzedResponse] = await Promise.all([
                fetch('/api/repositories/github/repos', {
                    headers: TokenManager.getAuthHeader()
                }),
                fetch('/api/repositories', {
                    headers: TokenManager.getAuthHeader()
                })
            ])

            if (githubResponse.ok) {
                const githubData = await githubResponse.json()
                setGithubRepos(githubData.repositories || [])
            }

            if (analyzedResponse.ok) {
                const analyzedData = await analyzedResponse.json()
                setAnalyzedRepos(analyzedData || [])
            }

        } catch (error) {
            console.error('Error fetching repositories:', error)
            setError('Failed to fetch repositories')
        } finally {
            setLoading(false)
        }
    }

    const handleSyncRepositories = async () => {
        try {
            setSyncLoading(true)
            setError('')

            const response = await fetch('/api/repositories/sync', {
                method: 'GET',
                headers: TokenManager.getAuthHeader()
            })

            if (response.ok) {
                const data = await response.json()
                // Refresh the repository list
                await fetchRepositories()
                // Show success message
                alert(`Successfully synced ${data.total_synced} repositories!`)
            } else {
                const errorData = await response.json()
                setError(errorData.detail || 'Failed to sync repositories')
            }

        } catch (error) {
            console.error('Sync error:', error)
            setError('Failed to sync repositories')
        } finally {
            setSyncLoading(false)
        }
    }

    const getDevOpsScore = (analysisData: Record<string, any>): number => {
        return analysisData?.devops_score || 0
    }

    const getScoreColor = (score: number): string => {
        if (score >= 80) return 'text-green-400'
        if (score >= 60) return 'text-yellow-400'
        if (score >= 40) return 'text-orange-400'
        return 'text-red-400'
    }

    const isRepositoryAnalyzed = (repoUrl: string): AnalyzedRepository | undefined => {
        return analyzedRepos.find(repo => repo.repo_url === repoUrl)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading your repositories...</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <Head>
                <title>Repositories - Meridian</title>
                <meta name="description" content="Manage and analyze your repositories" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200">
                <div className="container mx-auto px-4 py-8">
                    {/* Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <Breadcrumb items={[{ label: 'Repositories', icon: '📊' }]} />
                        <Link 
                            href="/enhanced-dashboard" 
                            className="btn-secondary flex items-center space-x-2"
                        >
                            <span>🚀</span>
                            <span>Enhanced Dashboard</span>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                📊 Repository Analysis
                            </h1>
                            <p className="text-gray-300">
                                Connect and analyze your GitHub repositories for DevOps insights
                            </p>
                        </div>
                        
                        <button
                            onClick={handleSyncRepositories}
                            disabled={syncLoading}
                            className="btn-primary flex items-center space-x-2"
                        >
                            {syncLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Github className="w-4 h-4" />
                            )}
                            <span>{syncLoading ? 'Syncing...' : 'Sync GitHub Repos'}</span>
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="w-5 h-5 text-red-400" />
                                <p className="text-red-300">{error}</p>
                                <button 
                                    onClick={() => setError('')}
                                    className="ml-auto text-red-400 hover:text-red-300"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Repository Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {githubRepos.map((repo) => {
                            const analyzedRepo = isRepositoryAnalyzed(repo.clone_url)
                            const isAnalyzing = analyzingRepos.has(analyzedRepo?.id || '')
                            const devopsScore = analyzedRepo ? getDevOpsScore(analyzedRepo.analysis_data) : null

                            return (
                                <div key={repo.id} className="card p-6 hover:scale-105 transition-all duration-300">
                                    {/* Repository Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white mb-1">
                                                {repo.name}
                                            </h3>
                                            <p className="text-sm text-gray-400 mb-2">
                                                {repo.description || 'No description available'}
                                            </p>
                                        </div>
                                        {repo.private && (
                                            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                                                Private
                                            </span>
                                        )}
                                    </div>

                                    {/* Repository Stats */}
                                    <div className="flex items-center space-x-4 mb-4 text-sm text-gray-400">
                                        {repo.language && (
                                            <span className="flex items-center space-x-1">
                                                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                                                <span>{repo.language}</span>
                                            </span>
                                        )}
                                        <span className="flex items-center space-x-1">
                                            <Star className="w-3 h-3" />
                                            <span>{repo.stars}</span>
                                        </span>
                                        <span className="flex items-center space-x-1">
                                            <GitFork className="w-3 h-3" />
                                            <span>{repo.forks}</span>
                                        </span>
                                    </div>

                                    {/* DevOps Score */}
                                    {devopsScore !== null && (
                                        <div className="mb-4 p-3 bg-dark-100/50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-300">DevOps Score</span>
                                                <span className={`text-lg font-bold ${getScoreColor(devopsScore)}`}>
                                                    {devopsScore}/100
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                                <div 
                                                    className={`h-2 rounded-full ${
                                                        devopsScore >= 80 ? 'bg-green-500' :
                                                        devopsScore >= 60 ? 'bg-yellow-500' :
                                                        devopsScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${devopsScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center justify-between">
                                        <a
                                            href={repo.html_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                                        >
                                            View on GitHub →
                                        </a>
                                        
                                        <div className="flex items-center space-x-2">
                                            {analyzedRepo ? (
                                                <>
                                                    {isAnalyzing ? (
                                                        <div className="flex items-center space-x-1 text-yellow-400">
                                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400"></div>
                                                            <span className="text-xs">Analyzing...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center space-x-1 text-green-400">
                                                            <CheckCircle className="w-3 h-3" />
                                                            <span className="text-xs">Analyzed</span>
                                                        </div>
                                                    )}
                                                    <Link 
                                                        href={`/enhanced-dashboard?repo=${encodeURIComponent(repo.full_name)}`}
                                                        className="text-xs bg-gradient-to-r from-primary-500 to-cyber-500 text-white px-3 py-1 rounded-lg hover:shadow-lg transition-all"
                                                    >
                                                        🚀 AI Analysis
                                                    </Link>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        // First sync the repo, then analyze
                                                        handleSyncRepositories().then(() => {
                                                            // After sync, find the repo and analyze
                                                            setTimeout(() => fetchRepositories(), 1000)
                                                        })
                                                    }}
                                                    className="text-xs btn-primary py-1 px-3"
                                                >
                                                    <Plus className="w-3 h-3 inline mr-1" />
                                                    Analyze First
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Last Updated */}
                                    <div className="mt-3 pt-3 border-t border-gray-600">
                                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {githubRepos.length === 0 && (
                        <div className="text-center py-12">
                            <Github className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No repositories found</h3>
                            <p className="text-gray-400 mb-6">
                                Connect your GitHub account to start analyzing your repositories
                            </p>
                            <button
                                onClick={handleSyncRepositories}
                                className="btn-primary"
                            >
                                Sync GitHub Repositories
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default withAuth(RepositoriesPage)

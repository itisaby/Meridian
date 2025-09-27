import Head from 'next/head'
import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { withAuth } from '../contexts/AuthContext'

function Dashboard() {
    const { user, logout } = useAuth()
    const router = useRouter()

    // Check if user needs to complete profile setup
    useEffect(() => {
        if (user && (!user.role || user.role === 'developer')) {
            // Redirect to profile setup if no proper role is set
            router.push('/profile-setup')
        }
    }, [user, router])

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

                    {/* Quick Actions */}
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <Link href="/repositories" className="card p-6 hover:scale-105 transition-transform cursor-pointer">
                            <div className="text-3xl mb-4">📊</div>
                            <h3 className="text-xl font-bold text-white mb-2">My Repositories</h3>
                            <p className="text-gray-400">View and manage your GitHub repositories</p>
                        </Link>

                        <Link href="/enhanced-dashboard" className="card p-6 hover:scale-105 transition-transform cursor-pointer bg-gradient-to-br from-primary-600 to-cyber-600">
                            <div className="text-3xl mb-4">🚀</div>
                            <h3 className="text-xl font-bold text-white mb-2">Enhanced Dashboard</h3>
                            <p className="text-gray-300">AI-powered DevOps insights and metrics</p>
                        </Link>

                        <div className="card p-6 hover:scale-105 transition-transform cursor-pointer">
                            <div className="text-3xl mb-4">🎯</div>
                            <h3 className="text-xl font-bold text-white mb-2">Learning Paths</h3>
                            <p className="text-gray-400">Personalized learning based on your current skills</p>
                        </div>

                        <div className="card p-6 hover:scale-105 transition-transform cursor-pointer">
                            <div className="text-3xl mb-4">🤝</div>
                            <h3 className="text-xl font-bold text-white mb-2">Team Collaboration</h3>
                            <p className="text-gray-400">Connect with peers and share knowledge</p>
                        </div>
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
                            We&apos;re working hard to bring you repository analysis, AI-powered insights, and team collaboration features.
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

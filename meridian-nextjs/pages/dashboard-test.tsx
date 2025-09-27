import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardTest() {
    const { user, logout, isAuthenticated, isLoading } = useAuth()

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
            default: return 'Developer'
        }
    }

    return (
        <>
            <Head>
                <title>Dashboard Test - Meridian</title>
                <meta name="description" content="Your Meridian dashboard test" />
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
                                <Link href="/auth-debug" className="text-gray-300 hover:text-primary-400 transition-colors">
                                    Auth Debug
                                </Link>
                                {user && (
                                    <>
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
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Dashboard Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="card p-8">
                        <h1 className="text-3xl font-bold text-white mb-6">Dashboard Test (Unprotected)</h1>

                        <div className="space-y-4">
                            <div>
                                <p className="text-gray-300"><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
                                <p className="text-gray-300"><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
                                <p className="text-gray-300"><strong>User:</strong> {user ? 'Yes' : 'No'}</p>
                            </div>

                            {user ? (
                                <div className="bg-dark-100 p-4 rounded">
                                    <h2 className="text-xl font-semibold text-white mb-4">
                                        Welcome, {user.name}! 👋
                                    </h2>
                                    <p className="text-gray-300">
                                        You are successfully authenticated as a {getRoleDisplayName(user.role)}.
                                    </p>

                                    <div className="mt-4">
                                        <Link href="/dashboard" className="btn-primary mr-4">
                                            Try Protected Dashboard
                                        </Link>
                                        <Link href="/profile" className="btn-secondary">
                                            Try Protected Profile
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                    <p className="text-red-300">
                                        Not authenticated. <Link href="/login" className="text-red-200 underline">Please login</Link>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    )
}

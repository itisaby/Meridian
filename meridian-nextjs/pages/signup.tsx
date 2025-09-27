import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { signIn } from 'next-auth/react'
import { Github } from 'lucide-react'

export default function SignupPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleGitHubSignup = async () => {
        setLoading(true)
        setError('')

        try {
            const result = await signIn('github', {
                callbackUrl: '/profile?setup=true',
                redirect: false
            })

            if (result?.error) {
                setError('Failed to authenticate with GitHub')
            } else if (result?.url) {
                // Redirect to callback URL
                window.location.href = result.url
            }
        } catch (error) {
            console.error('Signup error:', error)
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 flex items-center justify-center">
            <Head>
                <title>Sign Up - Meridian</title>
                <meta name="description" content="Join Meridian with your GitHub account" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <div className="max-w-md w-full mx-4">
                <div className="bg-dark-200 rounded-lg shadow-xl p-8">
                    <div className="text-center mb-8">
                        <Link href="/" className="text-3xl font-bold text-gradient">
                            Meridian
                        </Link>
                        <p className="text-gray-300 mt-2">
                            Navigate your DevOps journey to excellence
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-2">Join Meridian</h2>
                            <p className="text-gray-400">
                                Connect your GitHub account to start your personalized DevOps journey.
                            </p>
                        </div>

                        <button
                            onClick={handleGitHubSignup}
                            disabled={loading}
                            className="w-full btn-primary flex items-center justify-center space-x-3 py-3 px-4 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <Github className="w-5 h-5" />
                            )}
                            <span className="font-medium">
                                {loading ? 'Setting up your account...' : 'Continue with GitHub'}
                            </span>
                        </button>

                        <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
                            <h3 className="text-primary-300 font-semibold mb-2">What happens next?</h3>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>• Access your GitHub repositories</li>
                                <li>• Get personalized DevOps recommendations</li>
                                <li>• Track your coding progress</li>
                                <li>• Connect with the developer community</li>
                            </ul>
                        </div>

                        <div className="border-t border-gray-600 pt-6">
                            <div className="text-center">
                                <p className="text-gray-400 text-sm">
                                    Already have an account?{' '}
                                    <Link href="/login" className="text-primary-400 hover:text-primary-300 transition-colors">
                                        Sign in here
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-gray-500 text-xs">
                        By signing up, you agree to our{' '}
                        <a href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Terms of Service</a>{' '}
                        and{' '}
                        <a href="#" className="text-gray-400 hover:text-gray-300 transition-colors">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

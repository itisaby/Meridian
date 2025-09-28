import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/router'
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react'

interface UserType {
    id: string;
    name: string;
    email: string;
    role?: string;
    githubId?: string;
    githubLogin?: string;
    image?: string;
    skills?: string[];
    created_at?: string;
}

interface AuthContextType {
    user: UserType | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
    updateUser: (updatedUser: UserType) => void;
    session: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

interface AuthProviderProps {
    children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticatedState, setIsAuthenticatedState] = useState(false)
    const { data: session, status } = useSession()
    const router = useRouter()

    // Debug logging to identify the root cause
    console.log('🔍 NextAuth Debug:', {
        status,
        hasSession: !!session,
        sessionUser: session?.user?.name,
        timestamp: new Date().toISOString()
    })

    // Initialize auth state when session changes
    useEffect(() => {
        console.log('🔧 useEffect triggered with status:', status)

        const initAuth = async () => {
            if (status === 'loading') {
                console.log('NextAuth still loading, keeping isLoading=true')
                setIsLoading(true)
                return
            }

            if (session?.user) {
                console.log('✅ NextAuth session authenticated, setting up user data')
                // User is authenticated via NextAuth
                const userData = {
                    id: (session as any).user.id || 'github-user',
                    name: session.user.name || '',
                    email: session.user.email || '',
                    role: (session as any).user.role || 'developer',
                    githubId: (session as any).user.githubId,
                    githubLogin: (session as any).user.githubLogin,
                    image: session.user.image,
                    skills: [],
                    created_at: new Date().toISOString()
                }

                setUser(userData)
                setIsAuthenticatedState(true)
                console.log('✅ User authenticated and data set')

                // Store GitHub access token if available
                if ((session as any).accessToken) {
                    localStorage.setItem('github_token', (session as any).accessToken)
                }

                // Store Meridian token if available
                if ((session as any).meridianToken) {
                    localStorage.setItem('meridian_token', (session as any).meridianToken)
                    console.log('✅ Meridian token stored in localStorage')
                } else {
                    console.log('⚠️ No Meridian token found in session')
                }
            } else {
                console.log('❌ No session user found, setting unauthenticated state')
                setUser(null)
                setIsAuthenticatedState(false)
            }

            setIsLoading(false)
            console.log('🔧 Auth initialization complete')
        }

        initAuth()
    }, [session, status])

    const logout = async () => {
        try {
            setIsLoading(true)

            // Sign out from NextAuth
            if (session) {
                await nextAuthSignOut({ redirect: false })
            }

            // Clear local storage
            localStorage.removeItem('github_token')

            // Reset state
            setUser(null)
            setIsAuthenticatedState(false)

            // Redirect to home page
            router.push('/')
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const updateUser = (updatedUser: any) => {
        setUser(updatedUser)
    }

    const contextValue: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: isAuthenticatedState,
        logout,
        updateUser,
        session
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}

// Higher-order component for protected routes
export const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const AuthenticatedComponent: React.FC<P> = (props) => {
        const { isAuthenticated, isLoading, user } = useAuth()
        const router = useRouter()

        useEffect(() => {
            console.log('withAuth effect:', { isLoading, isAuthenticated, hasUser: !!user })
            if (!isLoading && !isAuthenticated) {
                console.log('Redirecting to login from withAuth')
                router.push('/login')
            }
        }, [isAuthenticated, isLoading, router, user])

        console.log('withAuth render:', { isLoading, isAuthenticated, hasUser: !!user })

        if (isLoading) {
            console.log('withAuth: showing loading state')
            return (
                <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                        <p className="text-gray-300">Loading...</p>
                    </div>
                </div>
            )
        }

        if (!isAuthenticated) {
            console.log('withAuth: not authenticated, returning null')
            return null // Will redirect to login
        }

        console.log('withAuth: rendering protected component')
        return <WrappedComponent {...props} />
    }

    AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`
    return AuthenticatedComponent
}
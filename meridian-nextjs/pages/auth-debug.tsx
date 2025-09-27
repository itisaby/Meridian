import { useSession } from 'next-auth/react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthDebug() {
    const { data: session, status } = useSession()
    const { user, isLoading, isAuthenticated } = useAuth()

    return (
        <div className="min-h-screen bg-dark-200 p-8 text-white">
            <h1 className="text-2xl font-bold mb-6">Auth Debug</h1>

            <div className="space-y-4">
                <div className="bg-dark-100 p-4 rounded">
                    <h2 className="text-lg font-semibold mb-2">NextAuth Session</h2>
                    <p><strong>Status:</strong> {status}</p>
                    <p><strong>Session:</strong> {session ? 'Yes' : 'No'}</p>
                    {session && (
                        <pre className="text-xs mt-2 bg-dark-200 p-2 rounded overflow-auto">
                            {JSON.stringify(session, null, 2)}
                        </pre>
                    )}
                </div>

                <div className="bg-dark-100 p-4 rounded">
                    <h2 className="text-lg font-semibold mb-2">AuthContext</h2>
                    <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
                    <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
                    <p><strong>User:</strong> {user ? 'Yes' : 'No'}</p>
                    {user && (
                        <pre className="text-xs mt-2 bg-dark-200 p-2 rounded overflow-auto">
                            {JSON.stringify(user, null, 2)}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    )
}

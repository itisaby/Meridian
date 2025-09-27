import NextAuth from 'next-auth'
import GitHubProvider from 'next-auth/providers/github'

export const authOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: 'read:user user:email read:org repo'
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, account, profile, user }) {
            // Persist the OAuth access_token and refresh_token to the token right after signin
            if (account) {
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token
                token.provider = account.provider
                token.githubId = profile?.id
                token.githubLogin = profile?.login
            }

            // Store user data from signIn callback
            if (user?.id && user?.role) {
                token.userId = user.id
                token.userRole = user.role
                token.meridianToken = user.meridianToken
            }

            return token
        },
        async session({ session, token }) {
            // Send properties to the client
            session.accessToken = token.accessToken
            session.refreshToken = token.refreshToken
            session.provider = token.provider
            session.user.githubId = token.githubId
            session.user.githubLogin = token.githubLogin

            // Include backend user data
            if (token.userId) {
                session.user.id = token.userId
                session.user.role = token.userRole
                session.meridianToken = token.meridianToken
            }

            return session
        },
        async signIn({ user, account, profile }) {
            // Here we can create/update the user in our backend
            if (account?.provider === 'github') {
                try {
                    console.log('GitHub OAuth - calling backend with profile:', {
                        githubId: profile.id,
                        username: profile.login,
                        name: profile.name || profile.login,
                        email: profile.email
                    })

                    // Call our backend API to create/update user
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/github`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            githubId: profile.id,
                            username: profile.login,
                            name: profile.name || profile.login,
                            email: profile.email,
                            avatarUrl: profile.avatar_url,
                            bio: profile.bio,
                            location: profile.location,
                            company: profile.company,
                            blog: profile.blog,
                            publicRepos: profile.public_repos,
                            followers: profile.followers,
                            following: profile.following,
                            accessToken: account.access_token
                        })
                    })

                    console.log('Backend response status:', response.status)

                    if (response.ok) {
                        const userData = await response.json()
                        console.log('Backend success, user data:', userData)
                        // Store user data in the user object
                        user.id = userData.user.id
                        user.role = userData.user.role
                        user.meridianToken = userData.token
                        return true
                    } else {
                        const errorData = await response.text()
                        console.error('Backend error response:', response.status, errorData)
                        // Still allow sign in even if backend fails
                        console.log('Allowing GitHub OAuth to continue despite backend error')
                        user.id = profile.id
                        user.role = 'developer'
                        return true
                    }
                } catch (error) {
                    console.error('Error creating/updating user in backend:', error)
                    // Still allow sign in even if backend fails
                    console.log('Allowing GitHub OAuth to continue despite backend error')
                    user.id = profile.id
                    user.role = 'developer'
                    return true
                }
            }
            return true
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    debug: true, // Enable debug mode
    secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)

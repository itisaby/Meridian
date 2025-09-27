/**
 * Utility functions for token management
 */

export const TokenManager = {
    /**
     * Get the current Meridian token from localStorage
     */
    getMeridianToken(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('meridian_token')
    },

    /**
     * Set the Meridian token in localStorage
     */
    setMeridianToken(token: string): void {
        if (typeof window === 'undefined') return
        localStorage.setItem('meridian_token', token)
    },

    /**
     * Get the GitHub token from localStorage
     */
    getGitHubToken(): string | null {
        if (typeof window === 'undefined') return null
        return localStorage.getItem('github_token')
    },

    /**
     * Set the GitHub token in localStorage
     */
    setGitHubToken(token: string): void {
        if (typeof window === 'undefined') return
        localStorage.setItem('github_token', token)
    },

    /**
     * Clear all tokens
     */
    clearTokens(): void {
        if (typeof window === 'undefined') return
        localStorage.removeItem('meridian_token')
        localStorage.removeItem('github_token')
    },

    /**
     * Get authorization header for API calls
     */
    getAuthHeader(): HeadersInit {
        const token = this.getMeridianToken()
        if (!token) return {}
        
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    },

    /**
     * Check if user is authenticated (has valid Meridian token)
     */
    isAuthenticated(): boolean {
        return !!this.getMeridianToken()
    }
}

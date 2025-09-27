// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// API Response Types
export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    message?: string
    error?: string
}

export interface User {
    id: string
    name: string
    email: string
    role: 'student' | 'professional' | 'manager'
    skills: string[]
    created_at: string
}

export interface AuthResponse {
    user: User
    token: string
}

// API Client Class
class ApiClient {
    private baseUrl: string

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl
    }

    private getAuthHeaders(): Record<string, string> {
        const token = localStorage.getItem('meridian_token')
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        }
    }

    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        try {
            const data = await response.json()

            if (response.ok) {
                return {
                    success: true,
                    data
                }
            } else {
                return {
                    success: false,
                    error: data.message || `HTTP ${response.status}`,
                    message: data.message
                }
            }
        } catch (error) {
            return {
                success: false,
                error: 'Failed to parse response',
                message: 'Network or parsing error'
            }
        }
    }

    // Authentication Methods
    async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
        try {
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })

            return this.handleResponse<AuthResponse>(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to connect to server'
            }
        }
    }

    async signup(userData: {
        name: string
        email: string
        password: string
        role: string
    }): Promise<ApiResponse<AuthResponse>> {
        try {
            const response = await fetch(`${this.baseUrl}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            })

            return this.handleResponse<AuthResponse>(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to connect to server'
            }
        }
    }

    async getCurrentUser(): Promise<ApiResponse<User>> {
        try {
            const response = await fetch(`${this.baseUrl}/auth/me`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            })

            return this.handleResponse<User>(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to fetch user data'
            }
        }
    }

    async logout(): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/auth/logout`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            })

            // Clear local storage regardless of response
            localStorage.removeItem('meridian_token')
            localStorage.removeItem('meridian_user')

            return this.handleResponse(response)
        } catch (error) {
            // Clear local storage even if network fails
            localStorage.removeItem('meridian_token')
            localStorage.removeItem('meridian_user')

            return {
                success: false,
                error: 'Network error',
                message: 'Logged out locally'
            }
        }
    }

    // Repository Methods
    async addRepository(repoUrl: string): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/repositories`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ repo_url: repoUrl })
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to add repository'
            }
        }
    }

    async getRepositories(): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/repositories`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to fetch repositories'
            }
        }
    }

    async analyzeRepository(repoId: string): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/repositories/${repoId}/analyze`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to analyze repository'
            }
        }
    }

    // Profile Methods
    async createProfile(profileData: {
        user_type: string
        first_name: string
        last_name: string
        bio?: string
        location?: string
        timezone?: string
        github_username?: string
        linkedin_url?: string
        portfolio_url?: string
    }): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/profiles/`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(profileData)
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to create profile'
            }
        }
    }

    async getMyProfile(): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/profiles/me`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to fetch profile'
            }
        }
    }

    async getCompleteProfile(): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/profiles/me/complete`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to fetch complete profile'
            }
        }
    }

    async updateProfile(profileData: {
        first_name?: string
        last_name?: string
        bio?: string
        location?: string
        timezone?: string
        github_username?: string
        linkedin_url?: string
        portfolio_url?: string
    }): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/profiles/me`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(profileData)
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to update profile'
            }
        }
    }

    async uploadAvatar(file: File): Promise<ApiResponse> {
        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`${this.baseUrl}/profiles/me/avatar`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('meridian_token')}`
                },
                body: formData
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to upload avatar'
            }
        }
    }

    async addSkill(skillData: {
        name: string
        category: string
        proficiency_level: number
        years_experience?: number
        is_learning?: boolean
    }): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/profiles/me/skills`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(skillData)
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to add skill'
            }
        }
    }

    async getMySkills(): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/profiles/me/skills`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to fetch skills'
            }
        }
    }

    async updateSkill(skillId: number, skillData: {
        name?: string
        category?: string
        proficiency_level?: number
        years_experience?: number
        is_learning?: boolean
    }): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/profiles/me/skills/${skillId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(skillData)
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to update skill'
            }
        }
    }

    async deleteSkill(skillId: number): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/profiles/me/skills/${skillId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to delete skill'
            }
        }
    }

    async createLearningGoal(goalData: {
        title: string
        description?: string
        category: string
        priority: string
        target_date?: string
    }): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/profiles/me/goals`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(goalData)
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to create learning goal'
            }
        }
    }

    async getMyLearningGoals(): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/profiles/me/goals`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to fetch learning goals'
            }
        }
    }

    async updateLearningGoal(goalId: number, goalData: {
        title?: string
        description?: string
        category?: string
        priority?: string
        target_date?: string
        status?: string
        progress_percentage?: number
    }): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/profiles/me/goals/${goalId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(goalData)
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to update learning goal'
            }
        }
    }

    async deleteLearningGoal(goalId: number): Promise<ApiResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/profiles/me/goals/${goalId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            })

            return this.handleResponse(response)
        } catch (error) {
            return {
                success: false,
                error: 'Network error',
                message: 'Failed to delete learning goal'
            }
        }
    }
}

// Create and export singleton instance
export const apiClient = new ApiClient()

// Utility functions
export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('meridian_token')
}

export const getCurrentUser = (): User | null => {
    if (typeof window === 'undefined') return null
    const userData = localStorage.getItem('meridian_user')
    return userData ? JSON.parse(userData) : null
}

export const clearAuth = (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('meridian_token')
    localStorage.removeItem('meridian_user')
}

export default apiClient

import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '../contexts/AuthContext'
import { TokenManager } from '../lib/tokenManager'
import { BookOpen, Briefcase, Users } from 'lucide-react'

interface RoleOption {
    id: string
    title: string
    description: string
    icon: React.ComponentType<any>
    benefits: string[]
    color: string
}

const roleOptions: RoleOption[] = [
    {
        id: 'student',
        title: 'Student',
        description: 'Learning DevOps fundamentals and building projects',
        icon: BookOpen,
        benefits: [
            'Personalized learning paths',
            'Code quality feedback',
            'Tutorial recommendations',
            'Progress tracking'
        ],
        color: 'from-blue-500 to-blue-600'
    },
    {
        id: 'professional',
        title: 'Working Professional',
        description: 'Developer, DevOps Engineer, or Technical Specialist',
        icon: Briefcase,
        benefits: [
            'Advanced DevOps insights',
            'Best practice recommendations',
            'Performance optimization tips',
            'Technical skill development'
        ],
        color: 'from-green-500 to-green-600'
    },
    {
        id: 'manager',
        title: 'Manager',
        description: 'Team Lead, Engineering Manager, or Executive',
        icon: Users,
        benefits: [
            'Team performance analytics',
            'Cultural transformation insights',
            'Strategic recommendations',
            'ROI tracking and reporting'
        ],
        color: 'from-purple-500 to-purple-600'
    }
]

export default function ProfileSetup() {
    const router = useRouter()
    const { user, updateUser } = useAuth()
    const [selectedRole, setSelectedRole] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleRoleSelect = (roleId: string) => {
        setSelectedRole(roleId)
        setError('')
    }

    const handleSubmit = async () => {
        if (!selectedRole) {
            setError('Please select your role')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Update role via API
            const response = await fetch('/api/auth/role', {
                method: 'PUT',
                headers: TokenManager.getAuthHeader(),
                body: JSON.stringify({ role: selectedRole })
            })

            if (!response.ok) {
                throw new Error('Failed to update role')
            }

            // Update user context
            await updateUser({ ...user, role: selectedRole })

            // Redirect to dashboard
            router.push('/dashboard')

        } catch (error) {
            console.error('Role update error:', error)
            setError('Failed to update role. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200">
            <Head>
                <title>Profile Setup - Meridian</title>
                <meta name="description" content="Set up your Meridian profile" />
            </Head>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gradient mb-4">
                            Welcome to Meridian! 🧭
                        </h1>
                        <p className="text-xl text-gray-300 mb-2">
                            Let&apos;s personalize your DevOps journey
                        </p>
                        <p className="text-gray-400">
                            Choose your role to get customized insights and recommendations
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8 max-w-md mx-auto">
                            <p className="text-red-300 text-sm text-center">{error}</p>
                        </div>
                    )}

                    {/* Role Selection */}
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        {roleOptions.map((role) => {
                            const IconComponent = role.icon
                            const isSelected = selectedRole === role.id

                            return (
                                <div
                                    key={role.id}
                                    onClick={() => handleRoleSelect(role.id)}
                                    className={`
                                        relative cursor-pointer rounded-xl p-6 transition-all duration-300
                                        ${isSelected 
                                            ? 'bg-gradient-to-br ' + role.color + ' transform scale-105 shadow-2xl' 
                                            : 'bg-dark-200 hover:bg-dark-100 hover:scale-102'
                                        }
                                        border-2 ${isSelected ? 'border-white/20' : 'border-gray-600/20'}
                                        group
                                    `}
                                >
                                    {/* Selection Indicator */}
                                    {isSelected && (
                                        <div className="absolute -top-3 -right-3">
                                            <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center">
                                                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center mb-4">
                                        <div className={`
                                            inline-flex items-center justify-center w-16 h-16 rounded-full mb-4
                                            ${isSelected ? 'bg-white/20' : 'bg-primary-500/20 group-hover:bg-primary-500/30'}
                                        `}>
                                            <IconComponent className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-primary-400'}`} />
                                        </div>
                                        
                                        <h3 className={`text-xl font-bold mb-2 ${isSelected ? 'text-white' : 'text-white'}`}>
                                            {role.title}
                                        </h3>
                                        <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-300'}`}>
                                            {role.description}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                                            What you&apos;ll get:
                                        </h4>
                                        {role.benefits.map((benefit, index) => (
                                            <div key={index} className="flex items-start space-x-2">
                                                <div className={`w-1.5 h-1.5 rounded-full mt-2 ${isSelected ? 'bg-white' : 'bg-primary-400'}`}></div>
                                                <span className={`text-sm ${isSelected ? 'text-white/90' : 'text-gray-300'}`}>
                                                    {benefit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Submit Button */}
                    <div className="text-center">
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedRole || loading}
                            className={`
                                px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300
                                ${selectedRole && !loading
                                    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 hover:scale-105 shadow-lg'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }
                            `}
                        >
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Setting up your profile...</span>
                                </div>
                            ) : (
                                'Continue to Dashboard'
                            )}
                        </button>

                        <p className="text-gray-400 text-sm mt-4">
                            You can always change your role later in settings
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

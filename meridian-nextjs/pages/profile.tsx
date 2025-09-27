import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { useAuth } from '../contexts/AuthContext'
import ProfileForm from '../components/Profile/ProfileForm'

const PROFICIENCY_COLORS = {
    1: 'bg-red-500/20 text-red-300',
    2: 'bg-orange-500/20 text-orange-300',
    3: 'bg-yellow-500/20 text-yellow-300',
    4: 'bg-blue-500/20 text-blue-300',
    5: 'bg-green-500/20 text-green-300'
}

const PROFICIENCY_LABELS = {
    1: 'Beginner',
    2: 'Basic',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert'
}

const PRIORITY_COLORS = {
    high: 'bg-red-500/20 text-red-300',
    medium: 'bg-yellow-500/20 text-yellow-300',
    low: 'bg-green-500/20 text-green-300'
}

const STATUS_COLORS = {
    not_started: 'bg-gray-500/20 text-gray-300',
    in_progress: 'bg-blue-500/20 text-blue-300',
    completed: 'bg-green-500/20 text-green-300',
    paused: 'bg-orange-500/20 text-orange-300'
}

export default function ProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [editMode, setEditMode] = useState(false)
    const [profileData, setProfileData] = useState<any>(null)
    const [avatarFile, setAvatarFile] = useState(null)
    const [uploadingAvatar, setUploadingAvatar] = useState(false)

    const { session, isAuthenticated } = useAuth()

    useEffect(() => {
        if (!isAuthenticated && !session) {
            router.push('/login')
            return
        }

        // Check if this is a setup flow
        if (router.query.setup === 'true') {
            setEditMode(true)
        }

        loadProfile()
    }, [router, isAuthenticated, session])

    const loadProfile = async () => {
        setLoading(true)
        try {
            // For GitHub OAuth users, we might need to create a profile first
            if (session?.user && !profileData) {
                // Auto-populate profile from GitHub data
                const githubProfile = {
                    first_name: session.user.name?.split(' ')[0] || '',
                    last_name: session.user.name?.split(' ').slice(1).join(' ') || '',
                    bio: (session as any).user.bio || '',
                    location: (session as any).user.location || '',
                    github_username: (session as any).user.githubLogin || '',
                    avatar_url: session.user.image || null
                }

                // Set this as initial profile data for new users
                if (router.query.setup === 'true') {
                    setProfileData({
                        profile: githubProfile,
                        skills: [],
                        learning_goals: [],
                        total_skills: 0,
                        skills_by_category: {},
                        goals_by_status: {}
                    })
                    return
                }
            }

            // Try to load existing profile from API
            // Note: We'll need to update the API client for GitHub auth
            // For now, show the edit form for new users
            if (!profileData) {
                setEditMode(true)
            }
        } catch (error) {
            console.error('Error loading profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB')
            return
        }

        setUploadingAvatar(true)
        try {
            const response = await apiClient.uploadAvatar(file)
            if (response.success) {
                // Reload profile to get updated avatar URL
                await loadProfile()
            } else {
                alert(response.error || 'Failed to upload avatar')
            }
        } catch (error) {
            console.error('Error uploading avatar:', error)
            alert('Failed to upload avatar')
        } finally {
            setUploadingAvatar(false)
        }
    }

    const handleProfileUpdate = async () => {
        setEditMode(false)
        await loadProfile()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 flex items-center justify-center">
                <div className="text-white text-xl">Loading profile...</div>
            </div>
        )
    }

    if (editMode || !profileData) {
        const initialFormData = profileData ? {
            ...profileData.profile,
            skills: profileData.skills || [],
            learning_goals: profileData.learning_goals || []
        } : null;

        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200">
                <Head>
                    <title>Profile Setup - Meridian</title>
                </Head>

                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-white mb-4">
                                {profileData ? 'Edit Profile' : 'Complete Your Profile'}
                            </h1>
                            <p className="text-xl text-gray-300">
                                {profileData ? 'Update your information' : 'Let\'s set up your learning journey'}
                            </p>
                        </div>

                        <ProfileForm
                            onSuccess={handleProfileUpdate}
                            onCancel={() => setEditMode(false)}
                            initialData={initialFormData}
                            userType="student"
                        />
                    </div>
                </div>
            </div>
        )
    }

    const { profile, skills, learning_goals, total_skills, skills_by_category, goals_by_status } = profileData

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200">
            <Head>
                <title>{profile.first_name} {profile.last_name} - Profile</title>
            </Head>

            {/* Navigation */}
            <nav className="bg-dark-200/80 backdrop-blur-md border-b border-cyber-500/20 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="text-2xl font-bold text-gradient">
                            Meridian
                        </Link>
                        <div className="flex items-center space-x-6">
                            <Link href="/dashboard" className="text-gray-300 hover:text-primary-400 transition-colors">
                                Dashboard
                            </Link>
                            <button
                                onClick={() => setEditMode(true)}
                                className="btn-secondary px-4 py-2"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    {/* Profile Header */}
                    <div className="bg-dark-200/50 rounded-lg p-8 mb-8">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center space-x-6">
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-cyber-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                        {profile.avatar_url ? (
                                            <img
                                                src={`http://localhost:8000${profile.avatar_url}`}
                                                alt="Profile"
                                                className="w-24 h-24 rounded-full object-cover"
                                            />
                                        ) : (
                                            `${profile.first_name[0]}${profile.last_name[0]}`
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 bg-primary-500 hover:bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-colors">
                                        <span className="text-sm">📷</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarUpload}
                                            disabled={uploadingAvatar}
                                        />
                                    </label>
                                    {uploadingAvatar && (
                                        <div className="absolute inset-0 bg-dark-200/80 rounded-full flex items-center justify-center">
                                            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Basic Info */}
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2">
                                        {profile.first_name} {profile.last_name}
                                    </h1>
                                    <div className="flex items-center space-x-4 text-gray-300">
                                        <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-sm">
                                            {profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)}
                                        </span>
                                        {profile.location && (
                                            <span className="flex items-center space-x-1">
                                                <span>📍</span>
                                                <span>{profile.location}</span>
                                            </span>
                                        )}
                                    </div>
                                    {profile.bio && (
                                        <p className="text-gray-300 mt-3 max-w-2xl">{profile.bio}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start space-x-4">
                                {/* Edit Profile Button */}
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="btn-secondary px-4 py-2 flex items-center space-x-2"
                                >
                                    <span>✏️</span>
                                    <span>Edit Profile</span>
                                </button>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="bg-dark-100/30 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-primary-400">{total_skills}</div>
                                        <div className="text-sm text-gray-400">Skills</div>
                                    </div>
                                    <div className="bg-dark-100/30 rounded-lg p-4">
                                        <div className="text-2xl font-bold text-cyber-400">{learning_goals.length}</div>
                                        <div className="text-sm text-gray-400">Goals</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social Links */}
                        {(profile.github_username || profile.linkedin_url || profile.portfolio_url) && (
                            <div className="flex items-center space-x-4 pt-4 border-t border-cyber-500/20">
                                {profile.github_username && (
                                    <a
                                        href={`https://github.com/${profile.github_username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-2 text-gray-300 hover:text-primary-400 transition-colors"
                                    >
                                        <span>🐱</span>
                                        <span>GitHub</span>
                                    </a>
                                )}
                                {profile.linkedin_url && (
                                    <a
                                        href={profile.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-2 text-gray-300 hover:text-primary-400 transition-colors"
                                    >
                                        <span>💼</span>
                                        <span>LinkedIn</span>
                                    </a>
                                )}
                                {profile.portfolio_url && (
                                    <a
                                        href={profile.portfolio_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-2 text-gray-300 hover:text-primary-400 transition-colors"
                                    >
                                        <span>🌐</span>
                                        <span>Portfolio</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Skills Section */}
                        <div className="bg-dark-200/50 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Skills</h2>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-400">{total_skills} total</span>
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="btn-secondary px-3 py-1 text-sm"
                                    >
                                        {skills.length > 0 ? '+ Add Skill' : 'Add Skills'}
                                    </button>
                                </div>
                            </div>

                            {skills.length > 0 ? (
                                <div className="space-y-4">
                                    {Object.entries(skills_by_category).map(([category, count]) => (
                                        <div key={category} className="mb-6">
                                            <h3 className="text-lg font-semibold text-gray-200 mb-3 capitalize">
                                                {category.replace('_', ' ')} ({count})
                                            </h3>
                                            <div className="grid gap-3">
                                                {skills
                                                    .filter(skill => skill.category === category)
                                                    .map(skill => (
                                                        <div key={skill.id} className="bg-dark-100/30 rounded-lg p-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="font-semibold text-white">{skill.name}</h4>
                                                                <div className="flex items-center space-x-2">
                                                                    <span className={`px-2 py-1 text-xs rounded ${PROFICIENCY_COLORS[skill.proficiency_level]}`}>
                                                                        {PROFICIENCY_LABELS[skill.proficiency_level]}
                                                                    </span>
                                                                    {skill.is_learning && (
                                                                        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                                                                            Learning
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {skill.years_experience && (
                                                                <p className="text-gray-400 text-sm">
                                                                    {skill.years_experience} years experience
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🎯</div>
                                    <p className="text-gray-400 mb-4">No skills added yet</p>
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="btn-primary px-6 py-2"
                                    >
                                        Add Skills
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Learning Goals Section */}
                        <div className="bg-dark-200/50 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-white">Learning Goals</h2>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-400">{learning_goals.length} total</span>
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="btn-secondary px-3 py-1 text-sm"
                                    >
                                        {learning_goals.length > 0 ? '+ Add Goal' : 'Set Goals'}
                                    </button>
                                </div>
                            </div>

                            {learning_goals.length > 0 ? (
                                <div className="space-y-4">
                                    {learning_goals.map(goal => (
                                        <div key={goal.id} className="bg-dark-100/30 rounded-lg p-4">
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold text-white flex-1">{goal.title}</h4>
                                                <div className="flex items-center space-x-2 ml-4">
                                                    <span className={`px-2 py-1 text-xs rounded ${PRIORITY_COLORS[goal.priority]}`}>
                                                        {goal.priority}
                                                    </span>
                                                    <span className={`px-2 py-1 text-xs rounded ${STATUS_COLORS[goal.status]}`}>
                                                        {goal.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>

                                            {goal.description && (
                                                <p className="text-gray-400 text-sm mb-3">{goal.description}</p>
                                            )}

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">
                                                    Category: {goal.category}
                                                </span>
                                                {goal.target_date && (
                                                    <span className="text-gray-500">
                                                        Target: {new Date(goal.target_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>

                                            {goal.progress_percentage > 0 && (
                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between text-sm mb-1">
                                                        <span className="text-gray-400">Progress</span>
                                                        <span className="text-gray-400">{goal.progress_percentage}%</span>
                                                    </div>
                                                    <div className="w-full bg-dark-100 rounded-full h-2">
                                                        <div
                                                            className="bg-gradient-to-r from-primary-500 to-cyber-500 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${goal.progress_percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🎯</div>
                                    <p className="text-gray-400 mb-4">No learning goals yet</p>
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="btn-primary px-6 py-2"
                                    >
                                        Set Goals
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

type User = {
    id: string;
    name: string;
    email: string;
    role: string;
};

type TeamMember = {
    user_id: string;
    role: string;
    user?: User;
};

type Project = {
    name: string;
    description: string;
    status: string;
    priority: string;
    repository_url: string;
};

export default function CreateProject() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Project data
    const [project, setProject] = useState<Project>({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        repository_url: ''
    });

    // Team management
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<TeamMember[]>([]);
    const [showUserSearch, setShowUserSearch] = useState(false);

    // Check manager role and redirect appropriately
    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        // Role-based redirection
        if (user.role === 'student') {
            router.push('/dashboard');
            return;
        } else if (user.role === 'professional') {
            router.push('/professional-dashboard');
            return;
        } else if (user.role !== 'manager') {
            // For any other roles or undefined roles, redirect to main dashboard
            router.push('/dashboard');
            return;
        }

        // Only managers can access this page
    }, [user, router]);

    const searchUsers = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/projects/users/search?role=professional&query=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.users || []);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const addTeamMember = (selectedUser: User) => {
        if (selectedMembers.find(m => m.user_id === selectedUser.id)) {
            return; // Already added
        }

        setSelectedMembers([...selectedMembers, {
            user_id: selectedUser.id,
            role: 'frontend',
            user: selectedUser
        }]);
        setSearchQuery('');
        setSearchResults([]);
        setShowUserSearch(false);
    };

    const removeTeamMember = (userId: string) => {
        setSelectedMembers(selectedMembers.filter(m => m.user_id !== userId));
    };

    const updateMemberRole = (userId: string, role: string) => {
        setSelectedMembers(selectedMembers.map(m =>
            m.user_id === userId ? { ...m, role } : m
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!project.name.trim() || !project.description.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        if (selectedMembers.length === 0) {
            setError('Please add at least one team member');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8000/projects/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    project,
                    team_members: selectedMembers.map(m => ({
                        user_id: m.user_id,
                        role: m.role
                    })),
                    manager_id: user?.id || 'f1f8a61b-13e9-49e7-a33c-cbff9fae8ff5' // Demo manager ID
                })
            });

            if (response.ok) {
                await response.json();
                setSuccess(`Project "${project.name}" created successfully!`);
                setTimeout(() => {
                    router.push('/manager-dashboard');
                }, 2000);
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Failed to create project');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            searchUsers(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <p className="text-white text-xl mb-4">{success}</p>
                    <p className="text-gray-300">Redirecting to manager dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200">
            {/* Navigation */}
            <nav className="bg-dark-200/80 backdrop-blur-md border-b border-cyber-500/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="text-2xl font-bold text-gradient">
                            Meridian
                        </Link>
                        <div className="flex items-center space-x-6">
                            <Link href="/manager-dashboard" className="text-gray-300 hover:text-primary-400 transition-colors">
                                Manager Dashboard
                            </Link>
                            <Link href="/dashboard" className="text-gray-300 hover:text-primary-400 transition-colors">
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        🚀 Create New Project
                    </h1>
                    <p className="text-gray-300">
                        Create a new project and assign team members with specific roles.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Project Details */}
                    <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl border border-gray-600/30 p-6">
                        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                            📋 Project Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Project Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={project.name}
                                    onChange={(e) => setProject({ ...project, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                    placeholder="Enter project name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Repository URL
                                </label>
                                <input
                                    type="url"
                                    value={project.repository_url}
                                    onChange={(e) => setProject({ ...project, repository_url: e.target.value })}
                                    className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                    placeholder="https://github.com/..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Status
                                </label>
                                <select
                                    value={project.status}
                                    onChange={(e) => setProject({ ...project, status: e.target.value })}
                                    className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="planning">Planning</option>
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Priority
                                </label>
                                <select
                                    value={project.priority}
                                    onChange={(e) => setProject({ ...project, priority: e.target.value })}
                                    className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Description *
                            </label>
                            <textarea
                                required
                                rows={4}
                                value={project.description}
                                onChange={(e) => setProject({ ...project, description: e.target.value })}
                                className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                placeholder="Describe the project..."
                            />
                        </div>
                    </div>

                    {/* Team Members */}
                    <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl border border-gray-600/30 p-6">
                        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                            👥 Team Members
                        </h2>

                        {/* Add Team Member */}
                        <div className="mb-6">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setShowUserSearch(true);
                                        }}
                                        onFocus={() => setShowUserSearch(true)}
                                        className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                        placeholder="Search professionals by name or email..."
                                    />

                                    {showUserSearch && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 bg-dark-200 border border-gray-600 rounded-lg mt-1 max-h-60 overflow-y-auto z-10">
                                            {searchResults.map(user => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => addTeamMember(user)}
                                                    className="w-full px-4 py-3 text-left hover:bg-dark-100 text-white flex items-center justify-between"
                                                >
                                                    <div>
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-sm text-gray-400">{user.email}</div>
                                                    </div>
                                                    <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-1 rounded">
                                                        {user.role}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Selected Team Members */}
                        <div className="space-y-4">
                            {selectedMembers.map(member => (
                                <div key={member.user_id} className="bg-dark-200/50 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold">
                                                {member.user?.name.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{member.user?.name}</div>
                                            <div className="text-sm text-gray-400">{member.user?.email}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <select
                                            value={member.role}
                                            onChange={(e) => updateMemberRole(member.user_id, e.target.value)}
                                            className="px-3 py-2 bg-dark-100 border border-gray-600 rounded text-white focus:outline-none focus:border-primary-500"
                                        >
                                            <option value="frontend">Frontend</option>
                                            <option value="backend">Backend</option>
                                            <option value="fullstack">Fullstack</option>
                                            <option value="devops">DevOps</option>
                                            <option value="designer">Designer</option>
                                            <option value="qa">QA</option>
                                        </select>

                                        <button
                                            type="button"
                                            onClick={() => removeTeamMember(member.user_id)}
                                            className="text-red-400 hover:text-red-300 p-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {selectedMembers.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    No team members added yet. Search and add professionals above.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error and Submit */}
                    {error && (
                        <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4">
                            <p className="text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Creating...
                                </>
                            ) : (
                                <>🚀 Create Project</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

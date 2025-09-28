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

type Repository = {
    repository_name: string;
    repository_url: string;
    description?: string;
    technology_stack?: string;
    primary_language?: string;
    branch: string;
    is_primary: boolean;
};

type RepositoryAssignment = {
    user_id: string;
    repository_name: string;
    role: string;
    user?: User;
};

type Project = {
    name: string;
    description: string;
    status: string;
    priority: string;
    repositories: Repository[];
};

export default function CreateMultiRepoProject() {
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
        repositories: []
    });

    // Repository management
    const [newRepo, setNewRepo] = useState<Repository>({
        repository_name: '',
        repository_url: '',
        description: '',
        technology_stack: '',
        primary_language: 'JavaScript',
        branch: 'main',
        is_primary: false
    });

    // Team management
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedAssignments, setSelectedAssignments] = useState<RepositoryAssignment[]>([]);
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
            console.log('Searching for users with query:', query);
            const response = await fetch(`http://localhost:8000/projects/users/search?role=professional&query=${encodeURIComponent(query)}`);
            if (response.ok) {
                const data = await response.json();
                console.log('Search results:', data);
                setSearchResults(data.users || []);
            } else {
                console.error('Failed to fetch users:', response.status);
            }
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const addRepository = () => {
        if (!newRepo.repository_name.trim() || !newRepo.repository_url.trim()) {
            setError('Please fill in repository name and URL');
            return;
        }

        // Set as primary if it's the first repository
        const repoToAdd = { ...newRepo, is_primary: project.repositories.length === 0 || newRepo.is_primary };

        // If setting as primary, unset other primary repos
        if (repoToAdd.is_primary) {
            project.repositories.forEach(repo => repo.is_primary = false);
        }

        setProject({
            ...project,
            repositories: [...project.repositories, repoToAdd]
        });

        setNewRepo({
            repository_name: '',
            repository_url: '',
            description: '',
            technology_stack: '',
            primary_language: 'JavaScript',
            branch: 'main',
            is_primary: false
        });
        setError('');
    };

    const removeRepository = (index: number) => {
        const updatedRepos = project.repositories.filter((_, i) => i !== index);
        setProject({ ...project, repositories: updatedRepos });

        // Remove assignments for this repository
        const removedRepo = project.repositories[index];
        setSelectedAssignments(selectedAssignments.filter(a => a.repository_name !== removedRepo.repository_name));
    };

    const addTeamMember = (selectedUser: User, repoName: string) => {
        console.log('Adding team member:', selectedUser, 'to repository:', repoName);

        if (selectedAssignments.find(a => a.user_id === selectedUser.id && a.repository_name === repoName)) {
            console.log('User already assigned to this repository');
            return; // Already assigned to this repository
        }

        const newAssignment = {
            user_id: selectedUser.id,
            repository_name: repoName,
            role: 'frontend',
            user: selectedUser
        };

        console.log('Creating assignment:', newAssignment);
        setSelectedAssignments([...selectedAssignments, newAssignment]);
        setSearchQuery('');
        setSearchResults([]);
        setShowUserSearch(false);
    };

    const removeAssignment = (userId: string, repoName: string) => {
        setSelectedAssignments(selectedAssignments.filter(a =>
            !(a.user_id === userId && a.repository_name === repoName)
        ));
    };

    const updateAssignmentRole = (userId: string, repoName: string, role: string) => {
        setSelectedAssignments(selectedAssignments.map(a =>
            (a.user_id === userId && a.repository_name === repoName) ? { ...a, role } : a
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!project.name.trim() || !project.description.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        if (project.repositories.length === 0) {
            setError('Please add at least one repository');
            return;
        }

        if (selectedAssignments.length === 0) {
            setError('Please assign at least one team member to a repository');
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
                    repository_assignments: selectedAssignments.map(a => ({
                        user_id: a.user_id,
                        repository_name: a.repository_name,
                        role: a.role
                    })),
                    manager_id: user?.id || 'f1f8a61b-13e9-49e7-a33c-cbff9fae8ff5'
                })
            });

            if (response.ok) {
                await response.json();
                setSuccess(`Project "${project.name}" created successfully with ${project.repositories.length} repositories!`);
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
                            <Link href="/create-project" className="text-gray-300 hover:text-primary-400 transition-colors">
                                Simple Project
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        🚀 Create Project
                    </h1>
                    <p className="text-gray-300">
                        Create a project with multiple repositories for modern software architecture.
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

                    {/* Repositories */}
                    <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl border border-gray-600/30 p-6">
                        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                            🗂️ Repositories
                        </h2>

                        {/* Add New Repository */}
                        <div className="border border-gray-600 rounded-lg p-4 mb-6">
                            <h3 className="text-lg font-medium text-white mb-4">Add Repository</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Repository name (e.g., user-service)"
                                        value={newRepo.repository_name}
                                        onChange={(e) => setNewRepo({ ...newRepo, repository_name: e.target.value })}
                                        className="w-full px-4 py-2 bg-dark-200 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="url"
                                        placeholder="Repository URL"
                                        value={newRepo.repository_url}
                                        onChange={(e) => setNewRepo({ ...newRepo, repository_url: e.target.value })}
                                        className="w-full px-4 py-2 bg-dark-200 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Tech stack (e.g., Node.js, React)"
                                        value={newRepo.technology_stack}
                                        onChange={(e) => setNewRepo({ ...newRepo, technology_stack: e.target.value })}
                                        className="w-full px-4 py-2 bg-dark-200 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <select
                                        value={newRepo.primary_language}
                                        onChange={(e) => setNewRepo({ ...newRepo, primary_language: e.target.value })}
                                        className="w-full px-4 py-2 bg-dark-200 border border-gray-600 rounded text-white focus:outline-none focus:border-primary-500"
                                    >
                                        <option value="JavaScript">JavaScript</option>
                                        <option value="TypeScript">TypeScript</option>
                                        <option value="Python">Python</option>
                                        <option value="Java">Java</option>
                                        <option value="Go">Go</option>
                                        <option value="Rust">Rust</option>
                                        <option value="C#">C#</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4">
                                <input
                                    type="text"
                                    placeholder="Description"
                                    value={newRepo.description}
                                    onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-dark-200 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={newRepo.is_primary}
                                            onChange={(e) => setNewRepo({ ...newRepo, is_primary: e.target.checked })}
                                            className="rounded"
                                        />
                                        Primary Repository
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={addRepository}
                                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
                                >
                                    Add Repository
                                </button>
                            </div>
                        </div>

                        {/* Repository List */}
                        <div className="space-y-4">
                            {project.repositories.map((repo, index) => (
                                <div key={index} className="bg-dark-200/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-white font-medium">{repo.repository_name}</h4>
                                            {repo.is_primary && (
                                                <span className="bg-blue-600/20 text-blue-300 text-xs px-2 py-1 rounded border border-blue-500/30">
                                                    PRIMARY
                                                </span>
                                            )}
                                            <span className="bg-purple-600/20 text-purple-300 text-xs px-2 py-1 rounded border border-purple-500/30">
                                                {repo.primary_language}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeRepository(index)}
                                            className="text-red-400 hover:text-red-300 p-1"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-2">{repo.description}</p>
                                    <p className="text-sm text-gray-500">{repo.repository_url}</p>
                                    {repo.technology_stack && (
                                        <p className="text-sm text-gray-500">Tech: {repo.technology_stack}</p>
                                    )}
                                </div>
                            ))}

                            {project.repositories.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    No repositories added yet. Add repositories above for your project.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Team Assignments */}
                    <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl border border-gray-600/30 p-6">
                        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                            👥 Repository Assignments
                        </h2>

                        {/* Add Team Member */}
                        <div className="mb-6">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            const query = e.target.value;
                                            setSearchQuery(query);
                                            setShowUserSearch(true);
                                            if (query.length > 0) {
                                                searchUsers(query);
                                            } else {
                                                setSearchResults([]);
                                            }
                                        }}
                                        onFocus={() => setShowUserSearch(true)}
                                        className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                        placeholder="Search professionals by name or email..."
                                    />

                                    {showUserSearch && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 bg-dark-200 border border-gray-600 rounded-lg mt-1 max-h-60 overflow-y-auto z-10 shadow-lg">
                                            {searchResults.map(searchUser => (
                                                <div key={searchUser.id} className="p-4 hover:bg-dark-100 text-white border-b border-gray-600/30 last:border-b-0">
                                                    <div className="font-medium">{searchUser.name}</div>
                                                    <div className="text-sm text-gray-400">{searchUser.email}</div>
                                                    <div className="text-xs text-blue-400 mb-2">Role: {searchUser.role}</div>
                                                    <div className="mt-2 flex gap-2 flex-wrap">
                                                        {project.repositories.length > 0 ? (
                                                            project.repositories.map(repo => {
                                                                const isAlreadyAssigned = selectedAssignments.find(a =>
                                                                    a.user_id === searchUser.id && a.repository_name === repo.repository_name
                                                                );
                                                                return (
                                                                    <button
                                                                        key={repo.repository_name}
                                                                        type="button"
                                                                        onClick={() => addTeamMember(searchUser, repo.repository_name)}
                                                                        disabled={!!isAlreadyAssigned}
                                                                        className={`text-xs px-2 py-1 rounded transition-colors ${isAlreadyAssigned
                                                                                ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                                                                                : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 cursor-pointer'
                                                                            }`}
                                                                    >
                                                                        {isAlreadyAssigned ? 'Already in' : 'Add to'} {repo.repository_name}
                                                                    </button>
                                                                );
                                                            })
                                                        ) : (
                                                            <div className="text-xs text-yellow-400">Add repositories first</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {showUserSearch && searchQuery.length > 0 && searchResults.length === 0 && (
                                        <div className="absolute top-full left-0 right-0 bg-dark-200 border border-gray-600 rounded-lg mt-1 p-4 z-10 text-gray-400 text-center">
                                            No professionals found matching &ldquo;{searchQuery}&rdquo;
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Assignments by Repository */}
                        <div className="space-y-6">
                            {project.repositories.map(repo => {
                                const repoAssignments = selectedAssignments.filter(a => a.repository_name === repo.repository_name);

                                return (
                                    <div key={repo.repository_name} className="bg-dark-200/30 rounded-lg p-4">
                                        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                                            📁 {repo.repository_name}
                                            <span className="text-sm text-gray-400">({repoAssignments.length} members)</span>
                                        </h3>

                                        <div className="space-y-3">
                                            {repoAssignments.map(assignment => (
                                                <div key={`${assignment.user_id}-${assignment.repository_name}`}
                                                    className="bg-dark-200/50 rounded-lg p-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                                                            <span className="text-white text-sm font-semibold">
                                                                {assignment.user?.name.charAt(0)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <div className="text-white font-medium">{assignment.user?.name}</div>
                                                            <div className="text-sm text-gray-400">{assignment.user?.email}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <select
                                                            value={assignment.role}
                                                            onChange={(e) => updateAssignmentRole(assignment.user_id, assignment.repository_name, e.target.value)}
                                                            className="px-3 py-2 bg-dark-100 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-primary-500"
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
                                                            onClick={() => removeAssignment(assignment.user_id, assignment.repository_name)}
                                                            className="text-red-400 hover:text-red-300 p-2 text-sm"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {repoAssignments.length === 0 && (
                                                <div className="text-center py-4 text-gray-500 text-sm">
                                                    No team members assigned to this repository yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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
                                <>🏗️ Create Multi-Repo Project</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

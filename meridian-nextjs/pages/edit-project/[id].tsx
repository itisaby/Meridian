import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

interface Repository {
    id?: string;
    repository_name: string;
    repository_url: string;
    description: string;
    technology_stack: string;
    primary_language: string;
    branch: string;
    is_primary: boolean;
}

interface RepositoryAssignment {
    id?: string;
    user_id: string;
    repository_name: string;
    role: string;
    user?: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}

interface Project {
    id: string;
    name: string;
    description: string;
    manager_id: string;
    status?: string;
    priority?: string;
    repositories: Repository[];
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export default function EditProject() {
    const router = useRouter();
    const { id } = router.query;
    const { user, isAuthenticated } = useAuth();

    const [project, setProject] = useState<Project>({
        id: '',
        name: '',
        description: '',
        manager_id: '',
        status: 'active',
        priority: 'medium',
        repositories: []
    });

    const [selectedAssignments, setSelectedAssignments] = useState<RepositoryAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // New repository form
    const [newRepo, setNewRepo] = useState<Repository>({
        repository_name: '',
        repository_url: '',
        description: '',
        technology_stack: '',
        primary_language: 'JavaScript',
        branch: 'main',
        is_primary: false
    });

    // User search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [showUserSearch, setShowUserSearch] = useState(false);

    // Authentication check
    useEffect(() => {
        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }

        if (user.role !== 'manager') {
            router.push('/dashboard');
            return;
        }
    }, [isAuthenticated, user, router]);

    // Load project data
    useEffect(() => {
        if (id && user?.id) {
            loadProjectData();
        }
    }, [id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadProjectData = async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');

            // Load project details
            const projectResponse = await fetch(`http://localhost:8000/projects/multi-repo/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (projectResponse.ok) {
                const projectData = await projectResponse.json();
                console.log('Loaded project data:', projectData);

                // Ensure the project has all required fields
                const loadedProject = {
                    ...projectData.project,
                    status: projectData.project.status || 'active',
                    priority: projectData.project.priority || 'medium'
                };

                setProject(loadedProject);

                // Load assignments
                const assignmentsResponse = await fetch(`http://localhost:8000/projects/${id}/assignments`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (assignmentsResponse.ok) {
                    const assignmentsData = await assignmentsResponse.json();
                    console.log('Loaded assignments data:', assignmentsData);
                    console.log('Number of assignments loaded:', assignmentsData.assignments?.length || 0);
                    setSelectedAssignments(assignmentsData.assignments || []);
                } else {
                    console.warn('Failed to load assignments:', assignmentsResponse.status);
                    const errorText = await assignmentsResponse.text().catch(() => 'Unknown error');
                    console.warn('Assignments error details:', errorText);
                    setSelectedAssignments([]);
                }
            } else {
                const errorData = await projectResponse.json().catch(() => ({ detail: 'Failed to load project' }));
                const errorMessage = typeof errorData.detail === 'string' ? errorData.detail : 'Failed to load project';
                setError(`Failed to load project data: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error loading project:', error);
            setError('Failed to load project data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

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

    const addRepository = () => {
        if (!newRepo.repository_name.trim() || !newRepo.repository_url.trim()) {
            setError('Please fill in repository name and URL');
            return;
        }

        const repoToAdd = { ...newRepo, is_primary: project.repositories.length === 0 || newRepo.is_primary };

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
        const removedRepo = project.repositories[index];
        const updatedRepos = project.repositories.filter((_, i) => i !== index);
        setProject({ ...project, repositories: updatedRepos });

        // Remove assignments for this repository
        setSelectedAssignments(selectedAssignments.filter(a => a.repository_name !== removedRepo.repository_name));
    };

    const addTeamMember = (selectedUser: User, repoName: string) => {
        if (selectedAssignments.find(a => a.user_id === selectedUser.id && a.repository_name === repoName)) {
            return;
        }

        setSelectedAssignments([...selectedAssignments, {
            user_id: selectedUser.id,
            repository_name: repoName,
            role: 'frontend',
            user: selectedUser
        }]);
        setSearchQuery('');
        setSearchResults([]);
        setShowUserSearch(false);
    };

    const removeAssignment = (userId: string, repoName: string) => {
        setSelectedAssignments(selectedAssignments.filter(a =>
            !(a.user_id === userId && a.repository_name === repoName)
        ));
    };

    const updateAssignmentRole = (userId: string, repoName: string, newRole: string) => {
        setSelectedAssignments(selectedAssignments.map(a =>
            a.user_id === userId && a.repository_name === repoName
                ? { ...a, role: newRole }
                : a
        ));
    };

    const handleUpdateProject = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!project.name.trim() || !project.description.trim()) {
            setError('Please fill in project name and description');
            return;
        }

        if (project.repositories.length === 0) {
            setError('Please add at least one repository');
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const updateData = {
                project: {
                    name: project.name,
                    description: project.description,
                    status: "active", // Set a default status
                    priority: "medium", // Set a default priority
                    repositories: project.repositories
                },
                repository_assignments: selectedAssignments
            };

            console.log('Updating project with data:', updateData);

            const response = await fetch(`http://localhost:8000/projects/multi-repo/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Update result:', result);
                setSuccess('Project updated successfully!');
                setTimeout(() => {
                    router.push('/manager-dashboard');
                }, 2000);
            } else {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                console.error('Update error:', errorData);
                const errorMessage = typeof errorData.detail === 'string' ? errorData.detail : 'Unknown error';
                setError(`Failed to update project: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error updating project:', error);
            setError('Failed to update project. Please check your connection.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100 flex items-center justify-center">
                <div className="text-white text-xl">Loading project...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-300 via-dark-200 to-dark-100">
            <div className="container mx-auto px-6 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Edit Project</h1>
                        <p className="text-gray-300">Update your project details, repositories, and team assignments</p>
                    </div>
                    <button
                        onClick={() => router.push('/manager-dashboard')}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                <form onSubmit={handleUpdateProject} className="space-y-8">
                    {/* Project Details */}
                    <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl border border-gray-600/30 p-6">
                        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                            📋 Project Details
                        </h2>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                                <input
                                    type="text"
                                    value={project.name}
                                    onChange={(e) => setProject({ ...project, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                    placeholder="Enter project name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={project.description}
                                    onChange={(e) => setProject({ ...project, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none"
                                    placeholder="Describe your project..."
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Repositories */}
                    <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl border border-gray-600/30 p-6">
                        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                            🗂️ Repositories
                        </h2>

                        {/* Add Repository Form */}
                        <div className="bg-dark-200/30 rounded-lg p-6 mb-6">
                            <h3 className="text-lg font-medium text-white mb-4">Add Repository</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input
                                    type="text"
                                    value={newRepo.repository_name}
                                    onChange={(e) => setNewRepo({ ...newRepo, repository_name: e.target.value })}
                                    className="px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                    placeholder="Repository Name"
                                />
                                <input
                                    type="url"
                                    value={newRepo.repository_url}
                                    onChange={(e) => setNewRepo({ ...newRepo, repository_url: e.target.value })}
                                    className="px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                    placeholder="Repository URL"
                                />
                                <input
                                    type="text"
                                    value={newRepo.description}
                                    onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                                    className="px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                    placeholder="Description"
                                />
                                <input
                                    type="text"
                                    value={newRepo.technology_stack}
                                    onChange={(e) => setNewRepo({ ...newRepo, technology_stack: e.target.value })}
                                    className="px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                    placeholder="Technology Stack (e.g., React, Node.js, MongoDB)"
                                />
                                <select
                                    value={newRepo.primary_language}
                                    onChange={(e) => setNewRepo({ ...newRepo, primary_language: e.target.value })}
                                    className="px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="JavaScript">JavaScript</option>
                                    <option value="TypeScript">TypeScript</option>
                                    <option value="Python">Python</option>
                                    <option value="Java">Java</option>
                                    <option value="C#">C#</option>
                                    <option value="Go">Go</option>
                                    <option value="Rust">Rust</option>
                                    <option value="Other">Other</option>
                                </select>
                                <input
                                    type="text"
                                    value={newRepo.branch}
                                    onChange={(e) => setNewRepo({ ...newRepo, branch: e.target.value })}
                                    className="px-4 py-3 bg-dark-200 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                                    placeholder="Branch (e.g., main, develop)"
                                />
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <label className="flex items-center text-white">
                                    <input
                                        type="checkbox"
                                        checked={newRepo.is_primary}
                                        onChange={(e) => setNewRepo({ ...newRepo, is_primary: e.target.checked })}
                                        className="mr-2"
                                    />
                                    Primary Repository
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={addRepository}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Add Repository
                            </button>
                        </div>

                        {/* Repository List */}
                        <div className="space-y-4">
                            {project.repositories.map((repo, index) => (
                                <div key={index} className="bg-dark-200/50 rounded-lg p-4 flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="text-white font-medium">{repo.repository_name}</h4>
                                            {repo.is_primary && (
                                                <span className="text-xs bg-primary-600/20 text-primary-300 px-2 py-1 rounded">
                                                    Primary
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-sm mb-1">{repo.description}</p>
                                        <div className="flex gap-4 text-xs text-gray-500">
                                            <span>Language: {repo.primary_language}</span>
                                            <span>Branch: {repo.branch}</span>
                                            <span>Stack: {repo.technology_stack}</span>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeRepository(index)}
                                        className="text-red-400 hover:text-red-300 ml-4"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}

                            {project.repositories.length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    No repositories added yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Repository Assignments */}
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
                                                            className="px-3 py-1 bg-dark-100 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-primary-500"
                                                        >
                                                            <option value="frontend">Frontend</option>
                                                            <option value="backend">Backend</option>
                                                            <option value="fullstack">Full Stack</option>
                                                            <option value="mobile">Mobile</option>
                                                            <option value="devops">DevOps</option>
                                                            <option value="qa">QA/Testing</option>
                                                        </select>

                                                        <button
                                                            type="button"
                                                            onClick={() => removeAssignment(assignment.user_id, assignment.repository_name)}
                                                            className="text-red-400 hover:text-red-300 text-sm"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {repoAssignments.length === 0 && (
                                                <div className="text-center py-4 text-gray-400 text-sm">
                                                    No team members assigned to this repository
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                            <p className="text-red-400">{typeof error === 'string' ? error : 'An error occurred'}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                            <p className="text-green-400">{typeof success === 'string' ? success : 'Success!'}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/manager-dashboard')}
                            className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Updating...' : 'Update Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

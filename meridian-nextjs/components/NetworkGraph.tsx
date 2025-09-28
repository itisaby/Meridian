import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';

interface NetworkNode {
    id: string;
    label: string;
    group: string;
    title?: string;
    color?: {
        background: string;
        border: string;
        highlight: {
            background: string;
            border: string;
        };
    };
    font?: {
        color: string;
        size: number;
    };
    size?: number;
    image?: string;
    shape?: string;
}

interface NetworkEdge {
    id: string;
    from: string;
    to: string;
    label?: string;
    color?: {
        color: string;
        highlight: string;
    };
    arrows?: {
        to: {
            enabled: boolean;
            scaleFactor: number;
        };
    };
}

interface ProjectData {
    id: string;
    name: string;
    description: string;
    status: string;
    priority: string;
    repositories: Array<{
        repository_name: string;
        repository_url: string;
        description: string;
        technology_stack: string;
        primary_language: string;
        branch: string;
        is_primary: boolean;
    }>;
    assignments: Array<{
        user_id: string;
        repository_name: string;
        role: string;
        user: {
            id: string;
            username: string;
            email: string;
            github_avatar_url?: string;
        };
    }>;
}

interface NodeData {
    id: string;
    name?: string;
    username?: string;
    email?: string;
    [key: string]: string | number | boolean | undefined;
}

interface NetworkGraphProps {
    managerId: string;
    managerName: string;
    projects: ProjectData[];
    onNodeClick?: (nodeId: string, nodeType: 'manager' | 'project' | 'member', data?: NodeData) => void;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
    managerId,
    managerName,
    projects,
    onNodeClick
}) => {
    const networkRef = useRef<HTMLDivElement>(null);
    const networkInstance = useRef<Network | null>(null);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    useEffect(() => {
        if (!networkRef.current) return;

        // Create nodes and edges
        const nodes: NetworkNode[] = [];
        const edges: NetworkEdge[] = [];

        // Add manager node (root)
        nodes.push({
            id: managerId,
            label: `👔 ${managerName}`,
            group: 'manager',
            title: `Manager: ${managerName}`,
            color: {
                background: '#4F46E5',
                border: '#312E81',
                highlight: {
                    background: '#6366F1',
                    border: '#1E1B4B'
                }
            },
            font: {
                color: 'white',
                size: 16
            },
            size: 30,
            shape: 'dot'
        });

        // Add project nodes and connect to manager
        projects.forEach((project) => {
            const projectId = `project_${project.id}`;

            // Determine project status color
            let projectColor = '#10B981'; // green for active
            if (project.status === 'completed') projectColor = '#6B7280'; // gray
            if (project.status === 'on-hold') projectColor = '#F59E0B'; // yellow
            if (project.status === 'cancelled') projectColor = '#EF4444'; // red

            nodes.push({
                id: projectId,
                label: `📁 ${project.name}`,
                group: 'project',
                title: `Project: ${project.name}\nStatus: ${project.status}\nPriority: ${project.priority}\nRepositories: ${project.repositories.length}\nTeam Members: ${project.assignments.length}`,
                color: {
                    background: projectColor,
                    border: '#374151',
                    highlight: {
                        background: '#059669',
                        border: '#1F2937'
                    }
                },
                font: {
                    color: 'white',
                    size: 14
                },
                size: 25,
                shape: 'dot'
            });

            // Connect project to manager
            edges.push({
                id: `manager_to_${projectId}`,
                from: managerId,
                to: projectId,
                color: {
                    color: '#6B7280',
                    highlight: '#374151'
                },
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 0.8
                    }
                }
            });

            // Add team member nodes for each project
            const uniqueMembers = new Set<string>();

            project.assignments.forEach((assignment) => {
                const memberId = `member_${assignment.user_id}`;

                // Only add member if not already added for this project
                if (!uniqueMembers.has(assignment.user_id)) {
                    uniqueMembers.add(assignment.user_id);

                    // Get member roles for this project
                    const memberRoles = project.assignments
                        .filter(a => a.user_id === assignment.user_id)
                        .map(a => `${a.repository_name} (${a.role})`)
                        .join(', ');

                    nodes.push({
                        id: memberId,
                        label: `👤 ${assignment.user.username}`,
                        group: 'member',
                        title: `Team Member: ${assignment.user.username}\nEmail: ${assignment.user.email}\nAssignments: ${memberRoles}`,
                        color: {
                            background: '#8B5CF6',
                            border: '#5B21B6',
                            highlight: {
                                background: '#A78BFA',
                                border: '#4C1D95'
                            }
                        },
                        font: {
                            color: 'white',
                            size: 12
                        },
                        size: 20,
                        shape: assignment.user.github_avatar_url ? 'circularImage' : 'dot',
                        image: assignment.user.github_avatar_url || undefined
                    });

                    // Connect member to project
                    edges.push({
                        id: `${projectId}_to_${memberId}`,
                        from: projectId,
                        to: memberId,
                        label: memberRoles.split(',').length > 1 ? `${memberRoles.split(',').length} roles` : assignment.role,
                        color: {
                            color: '#9CA3AF',
                            highlight: '#6B7280'
                        },
                        arrows: {
                            to: {
                                enabled: true,
                                scaleFactor: 0.6
                            }
                        }
                    });
                }
            });

            // Add repository nodes for each project (optional - can be toggled)
            project.repositories.forEach((repo, index) => {
                const repoId = `repo_${project.id}_${index}`;

                // Determine technology color
                let techColor = '#6B7280'; // default gray
                if (repo.primary_language === 'JavaScript' || repo.primary_language === 'TypeScript') techColor = '#F7DF1E';
                if (repo.primary_language === 'Python') techColor = '#3776AB';
                if (repo.primary_language === 'Java') techColor = '#ED8B00';
                if (repo.primary_language === 'React' || repo.technology_stack.includes('React')) techColor = '#61DAFB';

                nodes.push({
                    id: repoId,
                    label: `📚 ${repo.repository_name}`,
                    group: 'repository',
                    title: `Repository: ${repo.repository_name}\nTechnology: ${repo.technology_stack}\nLanguage: ${repo.primary_language}\nBranch: ${repo.branch}\nPrimary: ${repo.is_primary ? 'Yes' : 'No'}`,
                    color: {
                        background: techColor,
                        border: '#374151',
                        highlight: {
                            background: '#9CA3AF',
                            border: '#1F2937'
                        }
                    },
                    font: {
                        color: repo.primary_language === 'JavaScript' || repo.primary_language === 'TypeScript' ? 'black' : 'white',
                        size: 10
                    },
                    size: 15,
                    shape: 'box'
                });

                // Connect repository to project
                edges.push({
                    id: `${projectId}_to_${repoId}`,
                    from: projectId,
                    to: repoId,
                    color: {
                        color: '#D1D5DB',
                        highlight: '#9CA3AF'
                    }
                });
            });
        });

        // Create datasets
        const nodesDataSet = new DataSet(nodes);
        const edgesDataSet = new DataSet(edges);

        // Network options
        const options = {
            layout: {
                hierarchical: {
                    enabled: true,
                    levelSeparation: 150,
                    nodeSpacing: 100,
                    treeSpacing: 200,
                    blockShifting: true,
                    edgeMinimization: true,
                    parentCentralization: true,
                    direction: 'UD',
                    sortMethod: 'directed'
                }
            },
            physics: {
                enabled: false
            },
            interaction: {
                hover: true,
                hoverConnectedEdges: true,
                selectConnectedEdges: true,
                zoomView: true,
                dragView: true
            },
            nodes: {
                borderWidth: 2,
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.2)',
                    size: 10,
                    x: 2,
                    y: 2
                }
            },
            edges: {
                width: 2,
                smooth: {
                    enabled: true,
                    type: 'dynamic',
                    roundness: 0.5
                },
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.1)',
                    size: 5,
                    x: 1,
                    y: 1
                }
            },
            groups: {
                manager: {
                    shape: 'dot',
                    size: 30
                },
                project: {
                    shape: 'dot',
                    size: 25
                },
                member: {
                    shape: 'dot',
                    size: 20
                },
                repository: {
                    shape: 'box',
                    size: 15
                }
            }
        };

        // Create network
        const network = new Network(
            networkRef.current,
            {
                nodes: nodesDataSet,
                edges: edgesDataSet
            },
            options
        );

        // Event listeners
        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0] as string;
                setSelectedNode(nodeId);

                // Determine node type and data
                let nodeType: 'manager' | 'project' | 'member' = 'member';
                let nodeData: NodeData | null = null;

                if (nodeId === managerId) {
                    nodeType = 'manager';
                    nodeData = { id: managerId, name: managerName };
                } else if (nodeId.startsWith('project_')) {
                    nodeType = 'project';
                    const projectId = nodeId.replace('project_', '');
                    const project = projects.find(p => p.id === projectId);
                    nodeData = project ? { id: projectId, name: project.name } : null;
                } else if (nodeId.startsWith('member_')) {
                    nodeType = 'member';
                    const userId = nodeId.replace('member_', '');
                    // Find user in assignments
                    for (const project of projects) {
                        const assignment = project.assignments.find(a => a.user_id === userId);
                        if (assignment) {
                            nodeData = {
                                id: assignment.user.id,
                                username: assignment.user.username,
                                email: assignment.user.email
                            };
                            break;
                        }
                    }
                }

                if (onNodeClick && nodeData) {
                    onNodeClick(nodeId, nodeType, nodeData);
                }
            }
        });

        // Hover effects
        network.on('hoverNode', () => {
            if (networkRef.current) {
                networkRef.current.style.cursor = 'pointer';
            }
        });

        network.on('blurNode', () => {
            if (networkRef.current) {
                networkRef.current.style.cursor = 'default';
            }
        });

        networkInstance.current = network;

        return () => {
            if (networkInstance.current) {
                networkInstance.current.destroy();
                networkInstance.current = null;
            }
        };
    }, [managerId, managerName, projects, onNodeClick]);

    return (
        <div className="w-full h-full">
            <div
                ref={networkRef}
                className="w-full h-full bg-gray-50 rounded-lg border border-gray-200"
                style={{ minHeight: '600px' }}
            />

            {/* Legend */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Legend</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-indigo-500"></div>
                        <span className="text-gray-700">👔 Manager</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                        <span className="text-gray-700">📁 Project</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                        <span className="text-gray-700">👤 Team Member</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-3 bg-gray-500"></div>
                        <span className="text-gray-700">📚 Repository</span>
                    </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                    💡 Click nodes to explore • Hover for details • Drag to navigate • Scroll to zoom
                </div>
            </div>

            {/* Selected Node Info */}
            {selectedNode && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Selected Node</h4>
                    <p className="text-xs text-blue-700">Node ID: {selectedNode}</p>
                </div>
            )}
        </div>
    );
};

export default NetworkGraph;

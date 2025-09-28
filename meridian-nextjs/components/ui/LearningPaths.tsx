import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    BookOpen,
    Clock,
    Target,
    Play,
    CheckCircle,
    ArrowRight,
    Trophy,
    Star,
    Lightbulb,
    Users,
    TrendingUp
} from 'lucide-react';

interface LearningModule {
    id: string;
    title: string;
    type: 'conceptual' | 'hands_on' | 'knowledge_check' | 'project';
    description: string;
    estimated_time_minutes: number;
    resources: LearningResource[];
    learning_objectives: string[];
    assessment_criteria?: string[];
}

interface LearningResource {
    id: string;
    title: string;
    type: 'video' | 'article' | 'documentation' | 'interactive' | 'course' | 'tutorial';
    url: string;
    provider: string;
    estimated_time_minutes: number;
    difficulty_level: 'beginner' | 'intermediate' | 'advanced';
    rating?: number;
    description: string;
}

interface LearningPath {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty_level: 'beginner' | 'intermediate' | 'advanced';
    total_estimated_hours: number;
    learning_goals: string[];
    success_criteria: string[];
    modules: LearningModule[];
    prerequisites: string[];
    tags: string[];
    progress_percentage: number;
    progress_status: 'not_started' | 'in_progress' | 'completed' | 'paused';
}

interface LearningPathsProps {
    userId: string;
    repositoryName?: string; // Add repository context
    onPathSelect?: (pathId: string) => void;
}

const LearningPaths: React.FC<LearningPathsProps> = ({ userId, repositoryName, onPathSelect }) => {
    const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'progress'>('overview');

    const fetchLearningPaths = useCallback(async () => {
        try {
            setLoading(true);
            // Use user-specific endpoint if available, otherwise fall back to demo
            const endpoint = repositoryName
                ? `/api/learning-paths/user/${userId}?repo=${encodeURIComponent(repositoryName)}`
                : `/api/learning-paths/user/${userId}`;

            let response = await fetch(endpoint);

            // If user-specific fails, fall back to demo data
            if (!response.ok) {
                console.log(`Repository-specific learning paths not found, using demo data`);
                response = await fetch(`/api/learning-paths/demo`);
            }

            if (response.ok) {
                const data = await response.json();
                setLearningPaths(data);
            }
        } catch (error) {
            console.error('Error fetching learning paths:', error);
            // Fall back to demo data on error
            try {
                const response = await fetch(`/api/learning-paths/demo`);
                if (response.ok) {
                    const data = await response.json();
                    setLearningPaths(data);
                }
            } catch (fallbackError) {
                console.error('Error fetching demo learning paths:', fallbackError);
            }
        } finally {
            setLoading(false);
        }
    }, [userId, repositoryName]);

    const generateNewPath = async () => {
        if (!repositoryName) {
            alert('Repository information is required to generate learning paths');
            return;
        }

        try {
            setGenerating(true);

            // First check if there are existing analyses for this repository
            const analysisHistoryResponse = await fetch(`/api/ai/analysis-history?repo=${encodeURIComponent(repositoryName)}`);

            let analysisId = null;
            if (analysisHistoryResponse.ok) {
                const analyses = await analysisHistoryResponse.json();
                if (analyses && analyses.length > 0) {
                    // Use the most recent analysis
                    analysisId = analyses[0].id;
                }
            }

            // If no analysis exists, we need to run one first
            if (!analysisId) {
                alert('No repository analysis found. Please run an AI analysis first on your repository from the Analytics tab.');
                return;
            }

            // Generate learning paths from existing analysis
            const learningPathResponse = await fetch(`/api/learning-paths/generate-from-analysis/${analysisId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (learningPathResponse.ok) {
                const result = await learningPathResponse.json();
                console.log('Learning paths generated:', result);

                // Refresh learning paths
                await fetchLearningPaths();
                alert(`Successfully generated ${result.learning_paths?.length || 0} new learning paths!`);
            } else {
                const error = await learningPathResponse.json();
                throw new Error(error.details || 'Failed to generate learning paths');
            }
        } catch (error) {
            console.error('Error generating new path:', error);
            alert(`Failed to generate new learning paths: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setGenerating(false);
        }
    }; useEffect(() => {
        fetchLearningPaths();
    }, [fetchLearningPaths]);

    const getDifficultyColor = (level: string) => {
        switch (level) {
            case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'paused': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const getModuleIcon = (type: string) => {
        switch (type) {
            case 'conceptual': return <Lightbulb className="w-4 h-4" />;
            case 'hands_on': return <Play className="w-4 h-4" />;
            case 'knowledge_check': return <CheckCircle className="w-4 h-4" />;
            case 'project': return <Target className="w-4 h-4" />;
            default: return <BookOpen className="w-4 h-4" />;
        }
    };

    const startLearningPath = async (pathId: string) => {
        try {
            const response = await fetch(`/api/learning-paths/${pathId}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId }),
            });

            if (response.ok) {
                fetchLearningPaths();
                if (onPathSelect) {
                    onPathSelect(pathId);
                }
            }
        } catch (error) {
            console.error('Error starting learning path:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (learningPaths.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">No Learning Paths Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Generate personalized learning paths based on your repository analysis.
                        {repositoryName ? ` This will create learning paths specifically for ${repositoryName}.` : ''}
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-4 max-w-md mx-auto">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            💡 <strong>Tip:</strong> Make sure you have run an AI analysis on your repository first
                            (available in the Analytics tab) before generating learning paths.
                        </p>
                    </div>
                    <Button onClick={generateNewPath} disabled={generating || !repositoryName}>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {generating ? 'Generating...' : 'Generate Learning Paths'}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (selectedPath) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedPath(null)}
                        className="mb-4"
                    >
                        ← Back to Learning Paths
                    </Button>
                    <div className="flex gap-2">
                        <Badge className={getDifficultyColor(selectedPath.difficulty_level)}>
                            {selectedPath.difficulty_level}
                        </Badge>
                        <Badge className={getStatusColor(selectedPath.progress_status)}>
                            {selectedPath.progress_status.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl mb-2">{selectedPath.title}</CardTitle>
                                <p className="text-gray-600 dark:text-gray-400">{selectedPath.description}</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm">{selectedPath.total_estimated_hours}h total</span>
                                </div>
                                <Progress value={selectedPath.progress_percentage} className="w-32" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="flex gap-4 border-b">
                    {['overview', 'modules', 'progress'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as 'overview' | 'modules' | 'progress')}
                            className={`px-4 py-2 capitalize ${activeTab === tab
                                ? 'border-b-2 border-blue-500 text-blue-600'
                                : 'text-gray-600 hover:text-gray-800'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Learning Goals
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {selectedPath.learning_goals.map((goal, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <Star className="w-4 h-4 mt-0.5 text-yellow-500" />
                                            <span className="text-sm">{goal}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="w-5 h-5" />
                                    Success Criteria
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {selectedPath.success_criteria.map((criteria, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
                                            <span className="text-sm">{criteria}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {selectedPath.prerequisites.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" />
                                        Prerequisites
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {selectedPath.prerequisites.map((prereq, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <ArrowRight className="w-4 h-4 mt-0.5 text-blue-500" />
                                                <span className="text-sm">{prereq}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Tags
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {selectedPath.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'modules' && (
                    <div className="space-y-4">
                        {selectedPath.modules.map((module, index) => (
                            <Card key={module.id} className="relative">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                {getModuleIcon(module.type)}
                                                <span className="font-medium">Module {index + 1}</span>
                                            </div>
                                            <h3 className="text-lg font-semibold">{module.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">{Math.round(module.estimated_time_minutes / 60)}h</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">{module.description}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <h4 className="font-medium mb-2">Learning Objectives</h4>
                                            <ul className="text-sm space-y-1">
                                                {module.learning_objectives.map((objective, idx) => (
                                                    <li key={idx} className="flex items-start gap-2">
                                                        <CheckCircle className="w-3 h-3 mt-1 text-green-500" />
                                                        <span>{objective}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-2">Resources ({module.resources.length})</h4>
                                            <div className="space-y-2">
                                                {module.resources.slice(0, 3).map((resource) => (
                                                    <div key={resource.id} className="text-sm border rounded p-2">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <BookOpen className="w-3 h-3" />
                                                            <span className="font-medium">{resource.title}</span>
                                                        </div>
                                                        <p className="text-gray-600 dark:text-gray-400 text-xs">
                                                            {resource.type} • {Math.round(resource.estimated_time_minutes / 60)}h • {resource.provider}
                                                        </p>
                                                    </div>
                                                ))}
                                                {module.resources.length > 3 && (
                                                    <p className="text-xs text-gray-500">
                                                        +{module.resources.length - 3} more resources
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button size="sm">
                                            <Play className="w-4 h-4 mr-2" />
                                            Start Module
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === 'progress' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Progress Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">Overall Progress</span>
                                        <span className="text-sm text-gray-600">{selectedPath.progress_percentage.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={selectedPath.progress_percentage} />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 border rounded">
                                        <div className="text-2xl font-bold text-blue-600">{selectedPath.modules.length}</div>
                                        <div className="text-sm text-gray-600">Total Modules</div>
                                    </div>
                                    <div className="text-center p-4 border rounded">
                                        <div className="text-2xl font-bold text-green-600">
                                            {Math.round(selectedPath.modules.length * selectedPath.progress_percentage / 100)}
                                        </div>
                                        <div className="text-sm text-gray-600">Completed</div>
                                    </div>
                                    <div className="text-center p-4 border rounded">
                                        <div className="text-2xl font-bold text-orange-600">{selectedPath.total_estimated_hours}h</div>
                                        <div className="text-sm text-gray-600">Total Time</div>
                                    </div>
                                    <div className="text-center p-4 border rounded">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {Math.round(selectedPath.total_estimated_hours * selectedPath.progress_percentage / 100)}h
                                        </div>
                                        <div className="text-sm text-gray-600">Time Spent</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Learning Paths</h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        {repositoryName
                            ? `Personalized learning journeys for ${repositoryName}`
                            : 'Personalized learning journeys based on your AI analysis'
                        }
                    </p>
                </div>
                <Button onClick={generateNewPath} disabled={generating || !repositoryName}>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {generating ? 'Generating...' : 'Generate New Path'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {learningPaths.map((path) => (
                    <Card key={path.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg mb-2">{path.title}</CardTitle>
                                    <Badge className={getDifficultyColor(path.difficulty_level)}>
                                        {path.difficulty_level}
                                    </Badge>
                                </div>
                                <Badge className={getStatusColor(path.progress_status)}>
                                    {path.progress_status.replace('_', ' ')}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                {path.description}
                            </p>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {path.total_estimated_hours}h
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="w-4 h-4" />
                                        {path.modules.length} modules
                                    </span>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-medium">Progress</span>
                                        <span className="text-xs text-gray-600">{path.progress_percentage.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={path.progress_percentage} className="h-2" />
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {path.tags.slice(0, 3).map((tag, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                    {path.tags.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{path.tags.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setSelectedPath(path)}
                                >
                                    View Details
                                </Button>
                                {path.progress_status === 'not_started' ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => startLearningPath(path.id)}
                                    >
                                        <Play className="w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedPath(path)}
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default LearningPaths;

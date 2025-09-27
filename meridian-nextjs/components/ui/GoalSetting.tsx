import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Target,
    Calendar,
    Star,
    Plus,
    Trash2,
    BookOpen
} from 'lucide-react';

interface LearningGoal {
    id: string;
    title: string;
    description: string;
    target_completion_date: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    current_skill_level: 'beginner' | 'intermediate' | 'advanced';
    target_skill_level: 'beginner' | 'intermediate' | 'advanced';
    motivation: string;
    status: 'active' | 'completed' | 'paused' | 'archived';
}

interface GoalSettingProps {
    userId: string;
    onGoalCreated?: (goal: LearningGoal) => void;
}

const GoalSetting: React.FC<GoalSettingProps> = ({ userId, onGoalCreated }) => {
    const [goals, setGoals] = useState<LearningGoal[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newGoal, setNewGoal] = useState({
        title: '',
        description: '',
        target_completion_date: '',
        priority: 'medium' as 'low' | 'medium' | 'high',
        category: '',
        current_skill_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
        target_skill_level: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
        motivation: '',
    });

    const priorityColors = {
        low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    const skillLevelColors = {
        beginner: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        intermediate: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        advanced: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    };

    const handleCreateGoal = async () => {
        if (!newGoal.title.trim() || !newGoal.description.trim()) {
            alert('Please fill in title and description');
            return;
        }

        const goalData = {
            ...newGoal,
            user_id: userId,
            status: 'active' as const,
        };

        try {
            const response = await fetch('/api/learning-paths/goals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(goalData),
            });

            if (response.ok) {
                const createdGoal = await response.json();
                setGoals([...goals, createdGoal]);
                setNewGoal({
                    title: '',
                    description: '',
                    target_completion_date: '',
                    priority: 'medium',
                    category: '',
                    current_skill_level: 'beginner',
                    target_skill_level: 'intermediate',
                    motivation: '',
                });
                setIsCreating(false);
                if (onGoalCreated) {
                    onGoalCreated(createdGoal);
                }
            }
        } catch (error) {
            console.error('Error creating goal:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'paused': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold">Learning Goals</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                        Set and track your learning objectives
                    </p>
                </div>
                <Button onClick={() => setIsCreating(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Goal
                </Button>
            </div>

            {isCreating && (
                <Card className="border-2 border-dashed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            Create Learning Goal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Title</label>
                                <input
                                    type="text"
                                    value={newGoal.title}
                                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                                    placeholder="e.g., Master Docker Containerization"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Category</label>
                                <input
                                    type="text"
                                    value={newGoal.category}
                                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                                    placeholder="e.g., DevOps, Security, CI/CD"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <textarea
                                value={newGoal.description}
                                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                                className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                                rows={3}
                                placeholder="Describe what you want to achieve..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Priority</label>
                                <select
                                    value={newGoal.priority}
                                    onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value as 'low' | 'medium' | 'high' })}
                                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Current Level</label>
                                <select
                                    value={newGoal.current_skill_level}
                                    onChange={(e) => setNewGoal({ ...newGoal, current_skill_level: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Target Level</label>
                                <select
                                    value={newGoal.target_skill_level}
                                    onChange={(e) => setNewGoal({ ...newGoal, target_skill_level: e.target.value as 'beginner' | 'intermediate' | 'advanced' })}
                                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Target Completion Date</label>
                                <input
                                    type="date"
                                    value={newGoal.target_completion_date}
                                    onChange={(e) => setNewGoal({ ...newGoal, target_completion_date: e.target.value })}
                                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Motivation</label>
                                <input
                                    type="text"
                                    value={newGoal.motivation}
                                    onChange={(e) => setNewGoal({ ...newGoal, motivation: e.target.value })}
                                    className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-600"
                                    placeholder="Why is this important to you?"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleCreateGoal}>
                                Create Goal
                            </Button>
                            <Button variant="outline" onClick={() => setIsCreating(false)}>
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {goals.length === 0 && !isCreating ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold mb-2">No Learning Goals Yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Set specific learning objectives to track your progress and stay motivated.
                        </p>
                        <Button onClick={() => setIsCreating(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Goal
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map((goal) => (
                        <Card key={goal.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg mb-2">{goal.title}</CardTitle>
                                        <div className="flex gap-2 mb-2">
                                            <Badge className={priorityColors[goal.priority]}>
                                                {goal.priority} priority
                                            </Badge>
                                            <Badge className={getStatusColor(goal.status)}>
                                                {goal.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">{goal.description}</p>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <BookOpen className="w-4 h-4" />
                                        <span>Category: {goal.category}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm">
                                        <Star className="w-4 h-4" />
                                        <span>
                                            Level:
                                            <Badge className={skillLevelColors[goal.current_skill_level]}>
                                                {goal.current_skill_level}
                                            </Badge>
                                            →
                                            <Badge className={skillLevelColors[goal.target_skill_level]}>
                                                {goal.target_skill_level}
                                            </Badge>
                                        </span>
                                    </div>

                                    {goal.target_completion_date && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            <span>Target: {new Date(goal.target_completion_date).toLocaleDateString()}</span>
                                        </div>
                                    )}

                                    {goal.motivation && (
                                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-sm">
                                            <strong>Motivation:</strong> {goal.motivation}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GoalSetting;

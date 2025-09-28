import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface AssessmentQuestion {
    id: string;
    category: string;
    question: string;
    type: 'rating' | 'multiple' | 'text';
    options?: string[];
    weight: number;
}

interface AssessmentResponse {
    question_id: string;
    response: string | number;
    category: string;
}

export default function DevOpsAssessment() {
    const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const router = useRouter();
    const { user } = useAuth();
    const { assessment_id } = router.query;

    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<AssessmentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
    const [isPersonalized, setIsPersonalized] = useState(false);

    // Transform MCP questions to frontend format
    const transformQuestions = (mcpQuestions: Array<{
        id: string;
        category: string;
        question: string;
        options: string[];
    }>): AssessmentQuestion[] => {
        return mcpQuestions.map((q, index) => ({
            id: q.id || `question_${index}`,
            category: q.category,
            question: q.question,
            type: 'multiple' as const,
            options: q.options,
            weight: 1.0
        }));
    };

    // Load personalized questions on component mount
    useEffect(() => {
        const loadQuestions = async () => {
            if (!user) {
                // Load default questions for non-authenticated users
                setAssessmentQuestions(getDefaultQuestions());
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await fetch('http://localhost:8000/devops-culture/generate-personalized-questions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                        current_skill_level: 'intermediate', // Could be user preference
                        focus_areas: ['collaboration', 'automation'] // Could be based on user history
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    setAssessmentQuestions(transformQuestions(data.questions));
                    setIsPersonalized(data.personalized);
                    console.log(`✨ Loaded ${data.question_count} personalized questions for ${data.current_level} level`);
                } else {
                    console.warn('Failed to load personalized questions, using defaults');
                    setAssessmentQuestions(getDefaultQuestions());
                }
            } catch (error) {
                console.error('Error loading personalized questions:', error);
                setAssessmentQuestions(getDefaultQuestions());
            } finally {
                setLoading(false);
            }
        };

        loadQuestions();
    }, [user]);

    // Fetch assessment history for the user
    useEffect(() => {
        if (!user) return;
        const fetchHistory = async () => {
            try {
                setLoadingHistory(true);
                const response = await fetch(`http://localhost:8000/devops-culture/user-assessments/${user.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setAssessmentHistory(data.assessment_history || []);
                }
            } catch (error) {
                console.error('Error fetching assessment history:', error);
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }, [user]);

    // Default fallback questions when personalization fails
    const getDefaultQuestions = (): AssessmentQuestion[] => [
        // Collaboration Category
        {
            id: 'collab_1',
            category: 'Collaboration',
            question: 'How often do development and operations teams communicate during a typical sprint?',
            type: 'multiple',
            options: ['Never', 'Only during incidents', 'Weekly meetings', 'Daily standups', 'Continuous collaboration'],
            weight: 0.9
        },
        {
            id: 'collab_2',
            category: 'Collaboration',
            question: 'Rate your team\'s shared responsibility for production issues (1-10)',
            type: 'rating',
            weight: 0.8
        },
        {
            id: 'collab_3',
            category: 'Collaboration',
            question: 'Do development and operations teams share the same goals and KPIs?',
            type: 'multiple',
            options: ['No shared goals', 'Some overlap', 'Mostly aligned', 'Fully aligned goals', 'Joint OKRs'],
            weight: 0.9
        },

        // Automation Category
        {
            id: 'auto_1',
            category: 'Automation',
            question: 'What percentage of your deployment process is automated?',
            type: 'multiple',
            options: ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'],
            weight: 1.0
        },
        {
            id: 'auto_2',
            category: 'Automation',
            question: 'Rate your automated testing coverage (1-10)',
            type: 'rating',
            weight: 0.9
        },
        {
            id: 'auto_3',
            category: 'Automation',
            question: 'How is your infrastructure managed?',
            type: 'multiple',
            options: ['Manual configuration', 'Some scripts', 'Configuration management', 'Infrastructure as Code', 'GitOps with IaC'],
            weight: 0.9
        },

        // Monitoring Category  
        {
            id: 'monitor_1',
            category: 'Monitoring',
            question: 'Do you have real-time monitoring and alerting in production?',
            type: 'multiple',
            options: ['No monitoring', 'Basic logs', 'Some metrics', 'Comprehensive monitoring', 'Proactive/predictive monitoring'],
            weight: 1.0
        },
        {
            id: 'monitor_2',
            category: 'Monitoring',
            question: 'Rate your ability to trace issues from user experience to code (1-10)',
            type: 'rating',
            weight: 0.9
        },
        {
            id: 'monitor_3',
            category: 'Monitoring',
            question: 'How quickly can you detect production issues?',
            type: 'multiple',
            options: ['Hours/days', '30+ minutes', '10-30 minutes', '1-10 minutes', 'Real-time (<1 min)'],
            weight: 0.8
        },

        // Culture Category
        {
            id: 'culture_1',
            category: 'Culture',
            question: 'How does your organization typically handle production failures?',
            type: 'multiple',
            options: ['Blame individuals', 'Post-incident reviews', 'Blameless retrospectives', 'Learning culture', 'Failure celebration'],
            weight: 1.0
        },
        {
            id: 'culture_2',
            category: 'Culture',
            question: 'Rate your team\'s psychological safety to experiment and learn (1-10)',
            type: 'rating',
            weight: 0.9
        },
        {
            id: 'culture_3',
            category: 'Culture',
            question: 'How integrated is continuous improvement in your daily work?',
            type: 'multiple',
            options: ['Not at all', 'Occasional discussions', 'Regular retrospectives', 'Built into workflow', 'Core team practice'],
            weight: 0.8
        },

        // Delivery Category
        {
            id: 'delivery_1',
            category: 'Delivery',
            question: 'How frequently do you deploy to production?',
            type: 'multiple',
            options: ['Monthly or less', 'Bi-weekly', 'Weekly', 'Daily', 'Multiple times per day'],
            weight: 1.0
        },
        {
            id: 'delivery_2',
            category: 'Delivery',
            question: 'Rate your confidence in deploying to production at any time (1-10)',
            type: 'rating',
            weight: 0.9
        },
        {
            id: 'delivery_3',
            category: 'Delivery',
            question: 'What is your typical lead time from commit to production?',
            type: 'multiple',
            options: ['Weeks', 'Days', 'Hours', 'Minutes', 'Continuous deployment'],
            weight: 0.9
        }
    ];

    const handleResponse = (questionId: string, response: string | number, category: string) => {
        setResponses(prev => {
            const updated = prev.filter(r => r.question_id !== questionId);
            return [...updated, { question_id: questionId, response, category }];
        });
    };

    const nextStep = () => {
        if (currentStep < assessmentQuestions.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const submitAssessment = async () => {
        setSubmitting(true);
        try {
            // Convert responses to the expected format
            const responseData: Record<string, number> = {};
            console.log('Converting responses:', responses);

            responses.forEach((response) => {
                const question = assessmentQuestions.find(q => q.id === response.question_id);
                if (question) {
                    // Map question IDs to API expected format
                    const apiKey = getApiKey(question.category, question.question);

                    let numericValue: number;

                    if (question.type === 'rating') {
                        // For rating questions, response.response is already a number
                        numericValue = Number(response.response);
                    } else if (question.type === 'multiple') {
                        // For multiple choice, convert option index to 1-5 scale
                        // response.response contains the selected option text
                        const responseStr = String(response.response);
                        const selectedIndex = question.options?.indexOf(responseStr) ?? -1;
                        numericValue = selectedIndex >= 0 ? selectedIndex + 1 : 1;
                    } else {
                        numericValue = Number(response.response) || 1;
                    }

                    console.log(`Mapping: ${question.question} -> ${apiKey} = ${numericValue} (from: "${response.response}")`);
                    responseData[apiKey] = numericValue;
                }
            });

            console.log('Final responseData:', responseData);

            const requestBody = {
                user_id: user?.id || 'anonymous-user',
                responses: responseData,
                metadata: {
                    assessment_id: assessment_id,
                    completed_at: new Date().toISOString()
                }
            };

            console.log('Submitting assessment with data:', requestBody);

            const response = await fetch('http://localhost:8000/devops-culture/submit-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Assessment submitted successfully:', data);
                // Navigate to results page with the returned assessment ID
                router.push(`/devops-results?assessment_id=${data.assessment_id}`);
            } else {
                const errorData = await response.text();
                console.error('Assessment submission failed:', response.status, errorData);

                // Try to parse error details for better user feedback
                try {
                    const errorJson = JSON.parse(errorData);
                    if (errorJson.detail && Array.isArray(errorJson.detail)) {
                        const errors = errorJson.detail.map((err: { loc?: string[]; msg: string }) =>
                            `${err.loc?.join('.')} - ${err.msg}`
                        ).join('\n');
                        alert(`Validation errors:\n${errors}`);
                    } else {
                        alert(`Assessment submission failed: ${errorJson.detail || errorData}`);
                    }
                } catch {
                    alert(`Assessment submission failed: ${response.status} - ${errorData}`);
                }
                return;
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            alert(`Failed to submit assessment: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setSubmitting(false);
        }
    };

    // Helper function to map questions to API keys
    const getApiKey = (category: string, question: string): string => {
        // For AI-generated questions, we'll use a category-based mapping system
        const categoryMappings: Record<string, string[]> = {
            'Collaboration': ['collaboration_tools', 'cross_team_communication', 'shared_responsibilities'],
            'Automation': ['ci_cd_pipeline', 'infrastructure_automation', 'automated_testing'],
            'Monitoring': ['monitoring_alerting', 'observability', 'incident_response'],
            'Culture': ['psychological_safety', 'continuous_learning', 'failure_learning'],
            'Delivery': ['deployment_frequency', 'lead_time', 'customer_feedback']
        };

        // Get the mapping array for this category
        const mappings = categoryMappings[category] || ['unknown_metric'];

        // Use question content to determine specific mapping within category
        if (category === 'Collaboration') {
            if (question.toLowerCase().includes('cross-functional') || question.toLowerCase().includes('decision making')) {
                return 'cross_team_communication';
            }
            if (question.toLowerCase().includes('knowledge') || question.toLowerCase().includes('sharing')) {
                return 'shared_responsibilities';
            }
            return 'collaboration_tools';
        }

        if (category === 'Automation') {
            if (question.toLowerCase().includes('infrastructure') || question.toLowerCase().includes('iac')) {
                return 'infrastructure_automation';
            }
            if (question.toLowerCase().includes('test') || question.toLowerCase().includes('testing')) {
                return 'automated_testing';
            }
            return 'ci_cd_pipeline';
        }

        if (category === 'Monitoring') {
            if (question.toLowerCase().includes('observability') || question.toLowerCase().includes('tracing')) {
                return 'observability';
            }
            if (question.toLowerCase().includes('incident') || question.toLowerCase().includes('response')) {
                return 'incident_response';
            }
            return 'monitoring_alerting';
        }

        if (category === 'Culture') {
            if (question.toLowerCase().includes('psychological') || question.toLowerCase().includes('safety')) {
                return 'psychological_safety';
            }
            if (question.toLowerCase().includes('learning') || question.toLowerCase().includes('failure')) {
                return 'failure_learning';
            }
            return 'continuous_learning';
        }

        if (category === 'Delivery') {
            if (question.toLowerCase().includes('frequency') || question.toLowerCase().includes('deploy')) {
                return 'deployment_frequency';
            }
            if (question.toLowerCase().includes('feedback') || question.toLowerCase().includes('customer')) {
                return 'customer_feedback';
            }
            return 'lead_time';
        }

        // Fallback
        console.warn('Using fallback mapping for question:', question, 'category:', category);
        return mappings[0];
    };

    const currentQuestion = assessmentQuestions[currentStep];
    const progress = ((currentStep + 1) / assessmentQuestions.length) * 100;

    const categoryColors: Record<string, string> = {
        'Collaboration': 'bg-blue-600/20 border-blue-500/40 text-blue-300',
        'Automation': 'bg-green-600/20 border-green-500/40 text-green-300',
        'Monitoring': 'bg-yellow-600/20 border-yellow-500/40 text-yellow-300',
        'Culture': 'bg-purple-600/20 border-purple-500/40 text-purple-300',
        'Delivery': 'bg-red-600/20 border-red-500/40 text-red-300'
    };

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
                            <Link href="/devops-navigator" className="text-gray-300 hover:text-primary-400 transition-colors">
                                ← Back to Navigator
                            </Link>
                            <div className="flex items-center space-x-3">
                                <div className="text-2xl">📊</div>
                                <div>
                                    <div className="text-sm font-medium text-white">DevOps Assessment</div>
                                    <div className="text-xs text-gray-400">Cultural Analysis</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {loading ? (
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
                            <h2 className="text-xl font-semibold text-white mb-2">
                                🤖 Generating Your Personalized Assessment
                            </h2>
                            <p className="text-gray-400">
                                {user ? `Creating tailored questions based on your DevOps journey...` : `Loading assessment questions...`}
                            </p>
                        </div>
                    </div>
                </main>
            ) : assessmentQuestions.length === 0 ? (
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-white mb-4">Unable to Load Assessment</h2>
                        <p className="text-gray-400 mb-6">We couldn&apos;t load the assessment questions. Please try again later.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </main>
            ) : (
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Progress Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white">DevOps Culture Assessment</h1>
                                {isPersonalized && (
                                    <div className="flex items-center mt-2">
                                        <span className="text-sm bg-gradient-to-r from-primary-500 to-cyber-500 text-white px-3 py-1 rounded-full mr-2">
                                            🤖 AI Personalized
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            Questions adapted to your DevOps journey
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="text-sm text-gray-400">
                                {currentStep + 1} of {assessmentQuestions.length}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                            <div
                                className="bg-gradient-to-r from-primary-500 to-cyber-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-gray-300">
                                Help us understand your team&apos;s DevOps maturity to provide personalized guidance.
                            </p>
                            {isPersonalized && (
                                <div className="flex items-center space-x-2 bg-cyber-600/20 border border-cyber-500/40 rounded-full px-3 py-1">
                                    <span className="text-xs">🤖</span>
                                    <span className="text-xs font-medium text-cyber-300">AI-Personalized</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-8 mb-8">
                        <div className="mb-6">
                            <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 ${categoryColors[currentQuestion.category]
                                }`}>
                                {currentQuestion.category}
                            </div>
                            <h2 className="text-2xl font-semibold text-white mb-4">
                                {currentQuestion.question}
                            </h2>
                        </div>

                        {/* Answer Options */}
                        <div className="space-y-4 mb-8">
                            {currentQuestion.type === 'rating' && (
                                <div className="grid grid-cols-10 gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                                        <button
                                            key={rating}
                                            onClick={() => handleResponse(currentQuestion.id, rating, currentQuestion.category)}
                                            className={`h-12 rounded-lg border-2 font-semibold transition-all ${responses.find(r => r.question_id === currentQuestion.id)?.response === rating
                                                    ? 'bg-primary-600 border-primary-500 text-white'
                                                    : 'bg-dark-200/50 border-gray-600 text-gray-300 hover:border-primary-500'
                                                }`}
                                        >
                                            {rating}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {currentQuestion.type === 'multiple' && currentQuestion.options && (
                                <div className="space-y-3">
                                    {currentQuestion.options.map((option, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleResponse(currentQuestion.id, option, currentQuestion.category)}
                                            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${responses.find(r => r.question_id === currentQuestion.id)?.response === option
                                                    ? 'bg-primary-600/20 border-primary-500 text-white'
                                                    : 'bg-dark-200/50 border-gray-600 text-gray-300 hover:border-primary-500'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${responses.find(r => r.question_id === currentQuestion.id)?.response === option
                                                        ? 'bg-primary-500 border-primary-500'
                                                        : 'border-gray-600'
                                                    }`}></div>
                                                {option}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            {currentStep === assessmentQuestions.length - 1 ? (
                                <button
                                    onClick={submitAssessment}
                                    disabled={!responses.find(r => r.question_id === currentQuestion.id) || submitting}
                                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Analyzing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Complete Assessment</span>
                                            <span>🚀</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={nextStep}
                                    disabled={!responses.find(r => r.question_id === currentQuestion.id)}
                                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Progress */}
                    <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Assessment Progress by Category</h3>
                        <div className="grid md:grid-cols-5 gap-4">
                            {Object.keys(categoryColors).map((category) => {
                                const categoryQuestions = assessmentQuestions.filter(q => q.category === category);
                                const answeredQuestions = responses.filter(r => r.category === category);
                                const progress = (answeredQuestions.length / categoryQuestions.length) * 100;

                                return (
                                    <div key={category} className="text-center">
                                        <div className={`mx-auto w-16 h-16 rounded-full border-4 flex items-center justify-center mb-2 ${progress === 100
                                                ? 'border-green-500 bg-green-500/20 text-green-300'
                                                : progress > 0
                                                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-300'
                                                    : 'border-gray-600 bg-gray-600/20 text-gray-400'
                                            }`}>
                                            <span className="text-sm font-bold">
                                                {Math.round(progress)}%
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-300">{category}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Recent Assessment History */}
                    <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6 mt-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Recent Assessment History</h3>
                        {loadingHistory ? (
                            <div className="text-gray-400">Loading history...</div>
                        ) : assessmentHistory.length === 0 ? (
                            <div className="text-gray-400">No previous assessments found.</div>
                        ) : (
                            <div className="space-y-4">
                                {assessmentHistory.map((assessment) => (
                                    <div key={assessment.assessment_id} className="p-4 rounded-lg border border-gray-600/30 bg-dark-200/40 flex justify-between items-center">
                                        <div>
                                            <div className="text-lg font-semibold text-white">
                                                {Math.round(assessment.overall_score)}% - {assessment.maturity_level}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(assessment.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Link href={`/devops-results?assessment_id=${assessment.assessment_id}`} className="btn-secondary text-sm">View</Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            )}
        </div>
    );
}

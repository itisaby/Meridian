// --- Type Definitions ---
type AIRecommendation = {
    area: string;
    action: string;
    priority: string;
    effort: string;
};

type AssessmentHistoryItem = {
    assessment_id: string;
    maturity_level: string;
    overall_score: number;
    strengths?: string[];
    improvement_areas?: string[];
    ai_recommendations?: AIRecommendation[];
    next_steps?: string[];
    message?: string;
    created_at?: string;
};
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
// import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface Project {
    id: string;
    name: string;
}

interface AIGuidance {
    assessment_result: unknown;
    personalized_recommendations: string[];
    learning_path: {
        category: string;
        title: string;
        duration: string;
        difficulty: string;
    }[];
    transformation_roadmap: unknown;
    success_metrics: string[];
}

export default function DevOpsNavigator() {
    // --- State ---
    const [userAssessmentHistory, setUserAssessmentHistory] = useState<AssessmentHistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('assessment');
    const [aiGuidance, setAiGuidance] = useState<AIGuidance | null>(null);
    const router = useRouter();
    const { user } = useAuth();

    // --- AI Guidance Helpers ---
    const latestAssessment: AssessmentHistoryItem | null =
        userAssessmentHistory && userAssessmentHistory.length > 0
            ? userAssessmentHistory[0]
            : null;

    const cultureGuidance: AIRecommendation[] =
        latestAssessment && latestAssessment.ai_recommendations
            ? latestAssessment.ai_recommendations.filter(
                (rec) => rec.area && rec.area.toLowerCase().includes('culture')
            )
            : [];

    const renderCultureGuidance = () => (
        <div className="mb-8 p-6 rounded-xl shadow-xl bg-gradient-to-br from-dark-200 via-dark-100 to-dark-300 border border-cyber-500/30">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-primary-400">
                <span className="mr-2">🤖</span> AI Powered DevOps Guidance: <span className="ml-2 text-purple-400">Culture</span>
            </h2>
            {latestAssessment ? (
                <>
                    <div className="mb-4 flex items-center space-x-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-700/30 text-purple-300">
                            Maturity Level: {latestAssessment.maturity_level}
                        </span>
                    </div>
                    {latestAssessment.strengths && (
                        <div className="mb-2">
                            <span className="font-semibold text-green-400">Strengths:</span>
                            <ul className="list-disc ml-6 text-green-300">
                                {latestAssessment.strengths.map((s, idx) => (
                                    <li key={idx}>{s}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {latestAssessment.improvement_areas && (
                        <div className="mb-2">
                            <span className="font-semibold text-yellow-400">Improvement Areas:</span>
                            <ul className="list-disc ml-6 text-yellow-300">
                                {latestAssessment.improvement_areas.map((a, idx) => (
                                    <li key={idx}>{a}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className="mb-2">
                        <span className="font-semibold text-blue-400">AI Recommendations (Culture):</span>
                        <ul className="list-disc ml-6 text-blue-300">
                            {cultureGuidance.length > 0 ? cultureGuidance.map((rec, idx) => (
                                <li key={idx} className="mb-1">
                                    <span className="font-semibold text-primary-400">{rec.action}</span>
                                    <span className="text-xs text-gray-400 ml-2">({rec.priority}, {rec.effort})</span>
                                </li>
                            )) : (
                                <li className="italic text-gray-500 bg-dark-100/60 rounded px-3 py-2 border border-gray-700/30">No specific culture recommendations found.</li>
                            )}
                        </ul>
                    </div>
                    {latestAssessment.next_steps && (
                        <div className="mb-2">
                            <span className="font-semibold text-indigo-400">Next Steps:</span>
                            <ul className="list-disc ml-6 text-indigo-300">
                                {latestAssessment.next_steps.map((step, idx) => (
                                    <li key={idx}>{step}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {latestAssessment.message && (
                        <div className="mt-4 text-sm text-gray-400 bg-dark-100/60 rounded px-4 py-2 border border-gray-700/30">
                            {latestAssessment.message}
                        </div>
                    )}
                </>
            ) : (
                <div className="text-gray-500">No assessment data available. Complete an assessment to receive AI-powered guidance.</div>
            )}
        </div>
    );

    // Fetch projects for assessment
    useEffect(() => {
        const fetchProjects = async () => {
            if (!user || !user.id) return;
            try {
                const response = await fetch(`http://localhost:8000/projects/manager/${user.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setProjects(data.projects || []);
                    if (data.projects?.length > 0) {
                        setSelectedProject(data.projects[0].id);
                    }
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            }
        };
        fetchProjects();
    }, [user]);

    // Fetch existing assessments
    useEffect(() => {
        const fetchAssessments = async () => {
            if (!user || !user.id || !selectedProject) return;
            try {
                const response = await fetch(`http://localhost:8000/devops-culture/assessments/${selectedProject}`);
                if (response.ok) {
                    // const data = await response.json();
                    // removed unused setAssessments
                }
            } catch (error) {
                console.error('Error fetching assessments:', error);
            }
        };
        fetchAssessments();
    }, [user, selectedProject]);

    // Fetch user assessment history
    useEffect(() => {
        if (!user || !user.id) return;
        const fetchUserHistory = async () => {
            try {
                setLoadingHistory(true);
                const response = await fetch(`http://localhost:8000/devops-culture/user-assessments/${user.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setUserAssessmentHistory(data.assessment_history || []);
                }
            } catch (error) {
                console.error('Error fetching user assessment history:', error);
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchUserHistory();
    }, [user]);

    // Start new assessment with MCP integration
    const startAssessment = async () => {
        if (!selectedProject || !user || !user.id) return;
        setLoading(true);
        try {
            // Start assessment process
            const response = await fetch('http://localhost:8000/devops-culture/start-assessment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: selectedProject,
                    team_id: user.id,
                    assessment_type: 'comprehensive',
                }),
            });
            if (response.ok) {
                const data = await response.json();
                router.push(`/devops-assessment?assessment_id=${data.assessment_id}`);
            }
        } catch (error) {
            console.error('Error starting assessment:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get AI-powered guidance using MCP
    // ...existing code...

    const tabs = [
        { id: 'assessment', name: 'Culture Assessment', icon: '📊' },
        { id: 'guidance', name: 'AI Guidance', icon: '🤖' },
        { id: 'roadmap', name: 'Transformation', icon: '🗺️' },
        { id: 'metrics', name: 'DevOps Metrics', icon: '📈' },
    ];

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
                            <Link href="/dashboard" className="text-gray-300 hover:text-primary-400 transition-colors">
                                Dashboard
                            </Link>
                            <Link href="/manager-dashboard" className="text-gray-300 hover:text-primary-400 transition-colors">
                                Manager Hub
                            </Link>
                            <div className="flex items-center space-x-3">
                                <div className="text-2xl">🧭</div>
                                <div>
                                    <div className="text-sm font-medium text-white">DevOps Navigator</div>
                                    <div className="text-xs text-gray-400">Cultural Excellence</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center">
                        <span className="mr-4">🧭</span>
                        DevOps Culture Navigator
                    </h1>
                    <p className="text-xl text-gray-300">
                        Navigate your team to DevOps excellence with AI-powered cultural guidance and transformation roadmaps.
                    </p>
                </div>

                {/* Project Selection */}
                <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Select Project for Assessment</h3>
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                className="bg-dark-200 border border-gray-600 rounded-lg px-4 py-2 text-white"
                            >
                                <option value="">Choose a project...</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={startAssessment}
                            disabled={!selectedProject || loading}
                            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                        >
                            <span>🚀</span>
                            <span>Start New Assessment</span>
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-8">
                    <nav className="flex space-x-1 bg-dark-100/50 backdrop-blur-sm rounded-lg p-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-dark-200/50'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'assessment' && (
                    <div className="space-y-6">
                        {/* AI Powered DevOps Guidance for Culture */}
                        {renderCultureGuidance()}
                        {/* Assessment History */}
                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <h3 className="text-xl font-semibold text-white mb-4">Assessment History</h3>
                            {loadingHistory ? (
                                <div className="text-gray-400">Loading history...</div>
                            ) : userAssessmentHistory.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-6xl mb-4">📊</div>
                                    <h4 className="text-lg font-semibold text-white mb-2">No Assessments Yet</h4>
                                    <p className="text-gray-400 mb-4">Start your first DevOps culture assessment to begin your transformation journey.</p>
                                    <button onClick={startAssessment} className="btn-primary">
                                        Start Assessment
                                    </button>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {userAssessmentHistory.map((assessment) => (
                                        <div key={assessment.assessment_id} className="bg-dark-200/50 rounded-lg p-4 border border-gray-600/20">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${assessment.maturity_level === 'Expert' ? 'bg-green-600/20 text-green-300' :
                                                    assessment.maturity_level === 'Advanced' ? 'bg-blue-600/20 text-blue-300' :
                                                        assessment.maturity_level === 'Intermediate' ? 'bg-yellow-600/20 text-yellow-300' :
                                                            'bg-red-600/20 text-red-300'
                                                    }`}>
                                                    {assessment.maturity_level}
                                                </div>
                                                <div className="text-2xl font-bold text-white">{Math.round(assessment.overall_score)}%</div>
                                            </div>
                                            <div className="text-sm text-gray-400 mb-2">
                                                {assessment.created_at ? new Date(assessment.created_at).toLocaleDateString() : 'N/A'}
                                            </div>
                                            <div className="flex space-x-2">
                                                <Link href={`/devops-results?assessment_id=${assessment.assessment_id}`} className="btn-secondary text-xs flex-1">View</Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'guidance' && (
                    <div className="space-y-6">
                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                                <span className="mr-2">🤖</span>
                                AI-Powered DevOps Guidance
                            </h3>

                            {aiGuidance ? (
                                <div className="space-y-6">
                                    {/* Personalized Recommendations */}
                                    <div className="bg-dark-200/50 rounded-lg p-4">
                                        <h4 className="text-lg font-semibold text-white mb-3">Personalized Recommendations</h4>
                                        <div className="space-y-2">
                                            {aiGuidance.personalized_recommendations?.map((rec, index) => (
                                                <div key={index} className="flex items-start space-x-3 p-3 bg-primary-600/10 rounded border border-primary-500/20">
                                                    <span className="text-primary-400 mt-1">💡</span>
                                                    <p className="text-gray-300">{rec}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Learning Path */}
                                    <div className="bg-dark-200/50 rounded-lg p-4">
                                        <h4 className="text-lg font-semibold text-white mb-3">Recommended Learning Path</h4>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {aiGuidance.learning_path?.map((item, index) => (
                                                <div key={index} className="bg-dark-100/50 rounded p-3 border border-gray-600/20">
                                                    <div className="text-sm font-medium text-primary-300">{item.category}</div>
                                                    <div className="text-white">{item.title}</div>
                                                    <div className="text-xs text-gray-400">{item.duration} • {item.difficulty}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-6xl mb-4">🤖</div>
                                    <h4 className="text-lg font-semibold text-white mb-2">No AI Guidance Available</h4>
                                    <p className="text-gray-400 mb-4">Complete an assessment first to get personalized AI guidance.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'roadmap' && (
                    <div className="space-y-6">
                        <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                                <span className="mr-2">🗺️</span>
                                DevOps Transformation Roadmap
                            </h3>

                            <div className="grid lg:grid-cols-3 gap-6">
                                {/* Phase 1 */}
                                <div className="bg-blue-600/20 rounded-lg p-4 border border-blue-500/30">
                                    <h4 className="text-lg font-semibold text-blue-300 mb-3">Phase 1: Foundation</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                            <span className="text-gray-300">Establish CI/CD pipeline</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                            <span className="text-gray-300">Basic automation tools</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                            <span className="text-gray-300">Team collaboration setup</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-blue-300">Duration: 2-3 months</div>
                                </div>

                                {/* Phase 2 */}
                                <div className="bg-green-600/20 rounded-lg p-4 border border-green-500/30">
                                    <h4 className="text-lg font-semibold text-green-300 mb-3">Phase 2: Optimization</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                            <span className="text-gray-300">Advanced monitoring</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                            <span className="text-gray-300">Infrastructure as Code</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                            <span className="text-gray-300">Security integration</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-green-300">Duration: 3-4 months</div>
                                </div>

                                {/* Phase 3 */}
                                <div className="bg-purple-600/20 rounded-lg p-4 border border-purple-500/30">
                                    <h4 className="text-lg font-semibold text-purple-300 mb-3">Phase 3: Excellence</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                            <span className="text-gray-300">Culture transformation</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                            <span className="text-gray-300">Continuous improvement</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                            <span className="text-gray-300">Innovation practices</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-purple-300">Duration: 4-6 months</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'metrics' && (
                    <div className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* DORA Metrics */}
                            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                                <h4 className="text-lg font-semibold text-white mb-4">DORA Metrics</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-dark-200/50 rounded">
                                        <span className="text-gray-300">Deployment Frequency</span>
                                        <span className="text-green-300 font-semibold">Daily</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-dark-200/50 rounded">
                                        <span className="text-gray-300">Lead Time for Changes</span>
                                        <span className="text-yellow-300 font-semibold">2-4 hours</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-dark-200/50 rounded">
                                        <span className="text-gray-300">Recovery Time</span>
                                        <span className="text-blue-300 font-semibold">&lt; 1 hour</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-dark-200/50 rounded">
                                        <span className="text-gray-300">Change Failure Rate</span>
                                        <span className="text-red-300 font-semibold">&lt; 5%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Culture Health */}
                            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                                <h4 className="text-lg font-semibold text-white mb-4">Culture Health Score</h4>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Collaboration</span>
                                            <span className="text-white">85%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Automation</span>
                                            <span className="text-white">72%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Learning Culture</span>
                                            <span className="text-white">90%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-dark-100 rounded-lg p-8 text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
                            <p className="text-white">Processing with AI...</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

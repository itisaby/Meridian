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
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    RadialLinearScale,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

interface AssessmentResult {
    assessment_id: string;
    overall_score: number;
    maturity_level: string;
    category_scores: Record<string, number>;
    strengths: string[];
    improvement_areas: string[];
    ai_recommendations: Array<{
        area: string;
        action: string;
        priority: string;
        effort: string;
    }> | string[];
    transformation_roadmap: any;
    dora_metrics_prediction: Record<string, string>;
}

export default function DevOpsResults() {
    const router = useRouter();
    const { user } = useAuth();
    const { assessment_id } = router.query;

    const [results, setResults] = useState<AssessmentResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [aiGuidance, setAiGuidance] = useState<any>(null);
    const [showGuidance, setShowGuidance] = useState(false);

    // Fetch assessment results
    useEffect(() => {
        const fetchResults = async () => {
            if (!assessment_id) return;

            try {
                const response = await fetch(`http://localhost:8000/devops-culture/assessment-results/${assessment_id}`);
                if (response.ok) {
                    const data = await response.json();
                    setResults(data);
                }
            } catch (error) {
                console.error('Error fetching results:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [assessment_id]);

    // Generate AI guidance using MCP
    const generateAIGuidance = async () => {
        if (!assessment_id) return;

        setShowGuidance(true);
        try {
            const response = await fetch('http://localhost:8000/devops-culture/ai-guidance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessment_id: assessment_id,
                    guidance_type: 'comprehensive',
                    focus_areas: ['culture', 'automation', 'monitoring', 'collaboration', 'delivery']
                })
            });

            if (response.ok) {
                const data = await response.json();
                setAiGuidance(data);
            }
        } catch (error) {
            console.error('Error generating AI guidance:', error);
        }
    };

    const getMaturityColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case 'expert': return 'text-green-400 bg-green-600/20 border-green-500/40';
            case 'advanced': return 'text-blue-400 bg-blue-600/20 border-blue-500/40';
            case 'intermediate': return 'text-yellow-400 bg-yellow-600/20 border-yellow-500/40';
            case 'developing': return 'text-orange-400 bg-orange-600/20 border-orange-500/40';
            default: return 'text-red-400 bg-red-600/20 border-red-500/40';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400';
        if (score >= 60) return 'text-yellow-400';
        return 'text-red-400';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-white text-xl">Analyzing your DevOps culture...</p>
                    <p className="text-gray-400">AI is processing your responses</p>
                </div>
            </div>
        );
    }

    if (!results) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-white mb-2">Results Not Found</h2>
                    <p className="text-gray-400 mb-4">Unable to load assessment results.</p>
                    <Link href="/devops-navigator" className="btn-primary">
                        Back to Navigator
                    </Link>
                </div>
            </div>
        );
    }

    // Prepare chart data
    // Convert category scores (0-5) to percentages (0-100%) for radar chart
    const radarData = {
        labels: ['Collaboration', 'Automation', 'Monitoring', 'Culture', 'Delivery'],
        datasets: [
            {
                label: 'Category Scores (%)',
                data: [
                    (results.category_scores?.Collaboration || 0) * 20,
                    (results.category_scores?.Automation || 0) * 20,
                    (results.category_scores?.Monitoring || 0) * 20,
                    (results.category_scores?.Culture || 0) * 20,
                    (results.category_scores?.Delivery || 0) * 20,
                ],
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 2,
            },
        ],
    };

    const doughnutData = {
        labels: Object.keys(results.category_scores || {}),
        datasets: [
            {
                data: Object.values(results.category_scores || {}),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',  // Blue
                    'rgba(34, 197, 94, 0.8)',   // Green
                    'rgba(251, 191, 36, 0.8)',  // Yellow
                    'rgba(168, 85, 247, 0.8)',  // Purple
                    'rgba(239, 68, 68, 0.8)',   // Red
                ],
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.2)',
            },
        ],
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
                            {/* ...existing code... */}
                            <div className={`text-6xl font-bold ${getScoreColor(results.overall_score)}`}>
                                {results.overall_score}%
                            </div>
                            <div className="text-gray-400">Overall Score</div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Radar Chart */}
                <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Maturity Radar</h3>
                    <div className="h-64">
                        <Radar
                            data={radarData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        labels: { color: 'white' }
                                    }
                                },
                                scales: {
                                    r: {
                                        angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
                                        grid: { color: 'rgba(255, 255, 255, 0.2)' },
                                        pointLabels: { color: 'white' },
                                        ticks: { color: 'white', display: false },
                                        min: 0,
                                        max: 100
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Category Breakdown</h3>
                    <div className="h-64">
                        <Doughnut
                            data={doughnutData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'right',
                                        labels: { color: 'white', font: { size: 12 } }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Category Scores */}
            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6 mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Detailed Category Scores</h3>
                <div className="grid md:grid-cols-5 gap-4">
                    {Object.entries(results.category_scores || {}).map(([category, score]) => (
                        <div key={category} className="bg-dark-200/50 rounded-lg p-4 text-center">
                            <div className="text-sm text-gray-400 mb-2">{category}</div>
                            <div className={`text-3xl font-bold ${getScoreColor(score as number)}`}>
                                {Math.round(score as number)}%
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                <div
                                    className={`h-2 rounded-full ${(score as number) >= 80 ? 'bg-green-500' :
                                            (score as number) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${score}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Strengths and Areas for Improvement */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Strengths */}
                <div className="bg-green-600/10 backdrop-blur-sm rounded-xl shadow-xl border border-green-500/30 p-6">
                    <h3 className="text-xl font-semibold text-green-300 mb-4 flex items-center">
                        <span className="mr-2">🌟</span>
                        Your Strengths
                    </h3>
                    <div className="space-y-3">
                        {results.strengths?.map((strength, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-green-600/10 rounded border border-green-500/20">
                                <span className="text-green-400 mt-1">✅</span>
                                <p className="text-gray-300">{strength}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Improvement Areas */}
                <div className="bg-yellow-600/10 backdrop-blur-sm rounded-xl shadow-xl border border-yellow-500/30 p-6">
                    <h3 className="text-xl font-semibold text-yellow-300 mb-4 flex items-center">
                        <span className="mr-2">🎯</span>
                        Areas for Improvement
                    </h3>
                    <div className="space-y-3">
                        {results.improvement_areas?.map((area, index) => (
                            <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-600/10 rounded border border-yellow-500/20">
                                <span className="text-yellow-400 mt-1">🔄</span>
                                <p className="text-gray-300">{area}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white flex items-center">
                        <span className="mr-2">🤖</span>
                        AI-Powered Recommendations
                    </h3>
                    <button
                        onClick={generateAIGuidance}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <span>🧠</span>
                        <span>Get Detailed Guidance</span>
                    </button>
                </div>

                <div className="space-y-3">
                    {results.ai_recommendations?.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-3 p-4 bg-primary-600/10 rounded border border-primary-500/20">
                            <span className="text-primary-400 mt-1">💡</span>
                            <div className="text-gray-300 flex-1">
                                {typeof recommendation === 'string' ? (
                                    <p>{recommendation}</p>
                                ) : (
                                    <div>
                                        <div className="font-semibold text-white mb-1">{recommendation.area}</div>
                                        <p className="mb-2">{recommendation.action}</p>
                                        <div className="flex gap-4 text-sm">
                                            <span className="px-2 py-1 bg-yellow-600/20 text-yellow-300 rounded text-xs">
                                                Priority: {recommendation.priority}
                                            </span>
                                            <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">
                                                Effort: {recommendation.effort}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI Guidance Section */}
            {showGuidance && aiGuidance && (
                <div className="bg-gradient-to-r from-dark-100/60 to-dark-200/60 backdrop-blur-sm rounded-xl shadow-xl border border-cyber-500/30 p-6 mb-8">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                        <span className="mr-2">🧠</span>
                        Comprehensive AI Guidance
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Personalized Learning Path */}
                        <div className="bg-dark-200/50 rounded-lg p-4">
                            <h4 className="text-lg font-semibold text-cyber-300 mb-3">Learning Path</h4>
                            <div className="space-y-2">
                                {aiGuidance.learning_path?.map((item: any, index: number) => (
                                    <div key={index} className="p-3 bg-dark-100/50 rounded border border-gray-600/20">
                                        <div className="text-sm font-medium text-primary-300">{item.module}</div>
                                        <div className="text-white">{item.title}</div>
                                        <div className="text-xs text-gray-400">{item.estimated_time}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Items */}
                        <div className="bg-dark-200/50 rounded-lg p-4">
                            <h4 className="text-lg font-semibold text-cyber-300 mb-3">Immediate Actions</h4>
                            <div className="space-y-2">
                                {aiGuidance.immediate_actions?.map((action: string, index: number) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 bg-cyber-600/10 rounded border border-cyber-500/20">
                                        <span className="text-cyber-400 mt-1">⚡</span>
                                        <p className="text-gray-300">{action}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DORA Metrics Prediction */}
            <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6 mb-8">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <span className="mr-2">📊</span>
                    Predicted DORA Metrics
                </h3>
                <div className="grid md:grid-cols-4 gap-4">
                    {Object.entries(results.dora_metrics_prediction || {}).map(([metric, value]) => (
                        <div key={metric} className="bg-dark-200/50 rounded-lg p-4 text-center">
                            <div className="text-sm text-gray-400 mb-2 capitalize">
                                {metric.replace('_', ' ')}
                            </div>
                            <div className="text-lg font-semibold text-white">{value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
                <Link href="/devops-navigator" className="btn-secondary">
                    Back to Navigator
                </Link>
                <button
                    onClick={() => router.push(`/transformation-roadmap?assessment_id=${assessment_id}`)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <span>🗺️</span>
                    <span>Get Transformation Roadmap</span>
                </button>
            </div>
        </div>
    );
}

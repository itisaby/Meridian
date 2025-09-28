import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

interface RoadmapPhase {
    phase: string;
    duration: string;
    focus_areas: string[];
    key_activities: string[];
    success_metrics: string[];
    tools_technologies: string[];
}

interface TransformationRoadmap {
    roadmap_id: string;
    assessment_id: string;
    current_maturity: string;
    target_maturity: string;
    estimated_duration: string;
    phases: RoadmapPhase[];
    quick_wins: string[];
    critical_success_factors: string[];
    risk_mitigation: string[];
    resource_requirements: string[];
}

export default function TransformationRoadmap() {
    const router = useRouter();
    const { assessment_id } = router.query;

    const [roadmap, setRoadmap] = useState<TransformationRoadmap | null>(null);
    const [loading, setLoading] = useState(true);
    const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
    const [selectedPhase, setSelectedPhase] = useState(0);

    // Fetch or generate transformation roadmap
    useEffect(() => {
        const fetchRoadmap = async () => {
            if (!assessment_id) return;

            try {
                // First try to fetch existing roadmap
                const response = await fetch(`http://localhost:8000/devops-culture/transformation-roadmap/${assessment_id}`);

                if (response.ok) {
                    const data = await response.json();
                    setRoadmap(data);
                } else if (response.status === 404) {
                    // Generate new roadmap if not found
                    await generateRoadmap();
                }
            } catch (error) {
                console.error('Error fetching roadmap:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoadmap();
    }, [assessment_id]);

    const generateRoadmap = async () => {
        if (!assessment_id) return;

        setGeneratingRoadmap(true);
        try {
            const response = await fetch('http://localhost:8000/devops-culture/generate-roadmap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assessment_id: assessment_id,
                    target_maturity: 'Expert',
                    timeline_months: 12,
                    focus_areas: ['culture', 'automation', 'monitoring', 'collaboration', 'delivery']
                })
            });

            if (response.ok) {
                const data = await response.json();
                setRoadmap(data);
            }
        } catch (error) {
            console.error('Error generating roadmap:', error);
        } finally {
            setGeneratingRoadmap(false);
        }
    };

    const getPhaseIcon = (index: number) => {
        const icons = ['🚀', '🏗️', '⚡', '🎯', '🌟'];
        return icons[index % icons.length];
    };

    const getPhaseColor = (index: number) => {
        const colors = [
            'from-blue-500 to-cyan-500',
            'from-green-500 to-teal-500',
            'from-yellow-500 to-orange-500',
            'from-purple-500 to-pink-500',
            'from-red-500 to-rose-500'
        ];
        return colors[index % colors.length];
    };

    if (loading || generatingRoadmap) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-white text-xl">
                        {generatingRoadmap ? 'Generating your transformation roadmap...' : 'Loading roadmap...'}
                    </p>
                    <p className="text-gray-400">AI is creating your personalized journey</p>
                </div>
            </div>
        );
    }

    if (!roadmap) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🗺️</div>
                    <h2 className="text-2xl font-bold text-white mb-2">No Roadmap Available</h2>
                    <p className="text-gray-400 mb-4">Unable to generate transformation roadmap.</p>
                    <Link href="/devops-navigator" className="btn-primary">
                        Back to Navigator
                    </Link>
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
                            <Link href="/devops-navigator" className="text-gray-300 hover:text-primary-400 transition-colors">
                                ← Back to Navigator
                            </Link>
                            <div className="flex items-center space-x-3">
                                <div className="text-2xl">🗺️</div>
                                <div>
                                    <div className="text-sm font-medium text-white">Transformation Roadmap</div>
                                    <div className="text-xs text-gray-400">Your DevOps Journey</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Roadmap Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">🗺️ Your DevOps Transformation Roadmap</h1>
                    <div className="flex items-center justify-center space-x-8">
                        <div className="text-center">
                            <div className="text-sm text-gray-400">Current Level</div>
                            <div className="text-xl font-bold text-yellow-400">{roadmap.current_maturity}</div>
                        </div>
                        <div className="text-4xl">→</div>
                        <div className="text-center">
                            <div className="text-sm text-gray-400">Target Level</div>
                            <div className="text-xl font-bold text-green-400">{roadmap.target_maturity}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-400">Estimated Duration</div>
                            <div className="text-xl font-bold text-primary-400">{roadmap.estimated_duration}</div>
                        </div>
                    </div>
                </div>

                {/* Quick Wins Section */}
                <div className="bg-green-600/10 backdrop-blur-sm rounded-xl shadow-xl border border-green-500/30 p-6 mb-8">
                    <h3 className="text-xl font-semibold text-green-300 mb-4 flex items-center">
                        <span className="mr-2">⚡</span>
                        Quick Wins (Start Immediately)
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roadmap.quick_wins?.map((win, index) => (
                            <div key={index} className="bg-green-600/10 rounded-lg p-4 border border-green-500/20">
                                <div className="flex items-start space-x-3">
                                    <span className="text-green-400 text-xl">✨</span>
                                    <p className="text-gray-300">{win}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Transformation Phases */}
                <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6 mb-8">
                    <h3 className="text-xl font-semibold text-white mb-6">Transformation Phases</h3>

                    {/* Phase Navigation */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {roadmap.phases?.map((phase, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedPhase(index)}
                                className={`px-4 py-2 rounded-lg border transition-all ${selectedPhase === index
                                        ? 'bg-primary-600 border-primary-500 text-white'
                                        : 'bg-dark-200/50 border-gray-600/30 text-gray-300 hover:border-primary-500/50'
                                    }`}
                            >
                                <span className="mr-2">{getPhaseIcon(index)}</span>
                                Phase {index + 1}: {phase.phase}
                            </button>
                        ))}
                    </div>

                    {/* Selected Phase Details */}
                    {roadmap.phases && roadmap.phases[selectedPhase] && (
                        <div className={`bg-gradient-to-r ${getPhaseColor(selectedPhase)} p-0.5 rounded-xl mb-6`}>
                            <div className="bg-dark-200/90 rounded-xl p-6">
                                <div className="flex items-center mb-4">
                                    <span className="text-3xl mr-3">{getPhaseIcon(selectedPhase)}</span>
                                    <div>
                                        <h4 className="text-2xl font-bold text-white">
                                            Phase {selectedPhase + 1}: {roadmap.phases[selectedPhase].phase}
                                        </h4>
                                        <p className="text-gray-300">Duration: {roadmap.phases[selectedPhase].duration}</p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Focus Areas */}
                                    <div>
                                        <h5 className="text-lg font-semibold text-white mb-3">🎯 Focus Areas</h5>
                                        <ul className="space-y-2">
                                            {roadmap.phases[selectedPhase].focus_areas?.map((area, idx) => (
                                                <li key={idx} className="flex items-center space-x-2">
                                                    <span className="text-primary-400">▸</span>
                                                    <span className="text-gray-300">{area}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Key Activities */}
                                    <div>
                                        <h5 className="text-lg font-semibold text-white mb-3">🔧 Key Activities</h5>
                                        <ul className="space-y-2">
                                            {roadmap.phases[selectedPhase].key_activities?.map((activity, idx) => (
                                                <li key={idx} className="flex items-center space-x-2">
                                                    <span className="text-green-400">✓</span>
                                                    <span className="text-gray-300">{activity}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Success Metrics */}
                                    <div>
                                        <h5 className="text-lg font-semibold text-white mb-3">📊 Success Metrics</h5>
                                        <ul className="space-y-2">
                                            {roadmap.phases[selectedPhase].success_metrics?.map((metric, idx) => (
                                                <li key={idx} className="flex items-center space-x-2">
                                                    <span className="text-yellow-400">📈</span>
                                                    <span className="text-gray-300">{metric}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Tools & Technologies */}
                                    <div>
                                        <h5 className="text-lg font-semibold text-white mb-3">🛠️ Tools & Technologies</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {roadmap.phases[selectedPhase].tools_technologies?.map((tool, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-primary-600/20 border border-primary-500/30 rounded-full text-sm text-primary-300"
                                                >
                                                    {tool}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Critical Success Factors */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {/* Success Factors */}
                    <div className="bg-blue-600/10 backdrop-blur-sm rounded-xl shadow-xl border border-blue-500/30 p-6">
                        <h3 className="text-xl font-semibold text-blue-300 mb-4 flex items-center">
                            <span className="mr-2">🎯</span>
                            Critical Success Factors
                        </h3>
                        <div className="space-y-3">
                            {roadmap.critical_success_factors?.map((factor, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-600/10 rounded border border-blue-500/20">
                                    <span className="text-blue-400 mt-1">🔑</span>
                                    <p className="text-gray-300 text-sm">{factor}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Risk Mitigation */}
                    <div className="bg-orange-600/10 backdrop-blur-sm rounded-xl shadow-xl border border-orange-500/30 p-6">
                        <h3 className="text-xl font-semibold text-orange-300 mb-4 flex items-center">
                            <span className="mr-2">⚠️</span>
                            Risk Mitigation
                        </h3>
                        <div className="space-y-3">
                            {roadmap.risk_mitigation?.map((risk, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-orange-600/10 rounded border border-orange-500/20">
                                    <span className="text-orange-400 mt-1">🛡️</span>
                                    <p className="text-gray-300 text-sm">{risk}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resource Requirements */}
                    <div className="bg-purple-600/10 backdrop-blur-sm rounded-xl shadow-xl border border-purple-500/30 p-6">
                        <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
                            <span className="mr-2">👥</span>
                            Resource Requirements
                        </h3>
                        <div className="space-y-3">
                            {roadmap.resource_requirements?.map((resource, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-purple-600/10 rounded border border-purple-500/20">
                                    <span className="text-purple-400 mt-1">💼</span>
                                    <p className="text-gray-300 text-sm">{resource}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-4">
                    <Link href={`/devops-results?assessment_id=${assessment_id}`} className="btn-secondary">
                        Back to Results
                    </Link>
                    <Link href="/devops-navigator" className="btn-primary flex items-center space-x-2">
                        <span>🏠</span>
                        <span>Back to Navigator</span>
                    </Link>
                    <button
                        onClick={() => window.print()}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <span>📄</span>
                        <span>Export Roadmap</span>
                    </button>
                </div>
            </main>
        </div>
    );
}

import React, { useState } from 'react';
import Link from 'next/link';

export default function DevOpsDemo() {
    const [testResult, setTestResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const testMCPIntegration = async () => {
        setLoading(true);
        try {
            // Test the AI guidance endpoint which should work without team dependency
            const response = await fetch('http://localhost:8000/devops-culture/ai-guidance/test-user?focus_area=automation&learning_style=comprehensive');

            if (response.ok) {
                const data = await response.json();
                setTestResult({ status: 'success', data });
            } else {
                const error = await response.text();
                setTestResult({ status: 'error', error });
            }
        } catch (error) {
            setTestResult({ status: 'error', error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const testEndpoints = [
        {
            name: "DevOps Navigator Dashboard",
            path: "/devops-navigator",
            description: "Main dashboard with assessment management, AI guidance, and transformation roadmaps"
        },
        {
            name: "DevOps Assessment Form",
            path: "/devops-assessment",
            description: "Interactive assessment form with 15 questions across 5 DevOps categories"
        },
        {
            name: "AI Guidance API",
            description: "MCP-powered AI guidance generation using Gemini",
            action: testMCPIntegration
        }
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
                            <div className="flex items-center space-x-3">
                                <div className="text-2xl">🧪</div>
                                <div>
                                    <div className="text-sm font-medium text-white">DevOps Culture Demo</div>
                                    <div className="text-xs text-gray-400">System Testing</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Demo Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        🚀 DevOps Culture Navigation System
                    </h1>
                    <p className="text-xl text-gray-300 mb-6">
                        AI-Powered DevOps Culture Assessment &amp; Guidance Platform
                    </p>
                    <div className="bg-green-600/10 backdrop-blur-sm rounded-xl shadow-xl border border-green-500/30 p-6 mb-8">
                        <div className="flex items-center justify-center space-x-4 mb-4">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-300 font-semibold">System Status: ONLINE</span>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                                <div className="text-green-400">✅ Backend API</div>
                                <div className="text-gray-400">FastAPI Running</div>
                            </div>
                            <div className="text-center">
                                <div className="text-green-400">✅ MCP Server</div>
                                <div className="text-gray-400">Gemini AI Ready</div>
                            </div>
                            <div className="text-center">
                                <div className="text-green-400">✅ Frontend</div>
                                <div className="text-gray-400">Next.js Active</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Features */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">🎯 Core Features Implemented</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Assessment System */}
                        <div className="bg-blue-600/10 backdrop-blur-sm rounded-xl shadow-xl border border-blue-500/30 p-6">
                            <div className="text-3xl mb-3">📋</div>
                            <h3 className="text-lg font-semibold text-blue-300 mb-2">Comprehensive Assessment</h3>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>• 15 detailed questions</li>
                                <li>• 5 DevOps categories</li>
                                <li>• Maturity level scoring</li>
                                <li>• Progress tracking</li>
                            </ul>
                        </div>

                        {/* AI Guidance */}
                        <div className="bg-purple-600/10 backdrop-blur-sm rounded-xl shadow-xl border border-purple-500/30 p-6">
                            <div className="text-3xl mb-3">🤖</div>
                            <h3 className="text-lg font-semibold text-purple-300 mb-2">AI-Powered Guidance</h3>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>• MCP + Gemini integration</li>
                                <li>• Personalized recommendations</li>
                                <li>• Cultural insights</li>
                                <li>• Learning pathways</li>
                            </ul>
                        </div>

                        {/* Transformation Roadmaps */}
                        <div className="bg-green-600/10 backdrop-blur-sm rounded-xl shadow-xl border border-green-500/30 p-6">
                            <div className="text-3xl mb-3">🗺️</div>
                            <h3 className="text-lg font-semibold text-green-300 mb-2">Transformation Roadmaps</h3>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>• Multi-phase journeys</li>
                                <li>• Success metrics</li>
                                <li>• Risk mitigation</li>
                                <li>• Resource planning</li>
                            </ul>
                        </div>

                        {/* DORA Metrics */}
                        <div className="bg-yellow-600/10 backdrop-blur-sm rounded-xl shadow-xl border border-yellow-500/30 p-6">
                            <div className="text-3xl mb-3">📊</div>
                            <h3 className="text-lg font-semibold text-yellow-300 mb-2">DORA Metrics</h3>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>• Deployment frequency</li>
                                <li>• Lead time tracking</li>
                                <li>• MTTR monitoring</li>
                                <li>• Change failure rates</li>
                            </ul>
                        </div>

                        {/* Culture Analysis */}
                        <div className="bg-red-600/10 backdrop-blur-sm rounded-xl shadow-xl border border-red-500/30 p-6">
                            <div className="text-3xl mb-3">🎭</div>
                            <h3 className="text-lg font-semibold text-red-300 mb-2">Culture Analysis</h3>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>• Psychological safety</li>
                                <li>• Collaboration patterns</li>
                                <li>• Learning culture</li>
                                <li>• Team dynamics</li>
                            </ul>
                        </div>

                        {/* Automation Insights */}
                        <div className="bg-cyan-600/10 backdrop-blur-sm rounded-xl shadow-xl border border-cyan-500/30 p-6">
                            <div className="text-3xl mb-3">⚙️</div>
                            <h3 className="text-lg font-semibold text-cyan-300 mb-2">Automation Guidance</h3>
                            <ul className="text-sm text-gray-300 space-y-1">
                                <li>• CI/CD optimization</li>
                                <li>• Infrastructure automation</li>
                                <li>• Testing strategies</li>
                                <li>• Monitoring setup</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* System Test Section */}
                <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">🧪 System Testing</h2>
                    <div className="space-y-4">
                        {testEndpoints.map((endpoint, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-dark-200/50 rounded-lg border border-gray-600/20">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white">{endpoint.name}</h3>
                                    <p className="text-sm text-gray-400">{endpoint.description}</p>
                                </div>
                                <div>
                                    {endpoint.path ? (
                                        <Link href={endpoint.path} className="btn-primary">
                                            Test Page
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={endpoint.action}
                                            disabled={loading}
                                            className="btn-primary flex items-center space-x-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span>Testing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>🧠</span>
                                                    <span>Test API</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Test Results */}
                    {testResult && (
                        <div className="mt-6 p-4 rounded-lg border"
                            style={{
                                backgroundColor: testResult.status === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                borderColor: testResult.status === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                            }}>
                            <h4 className="font-semibold text-white mb-2">
                                {testResult.status === 'success' ? '✅ API Test Result' : '❌ API Test Error'}
                            </h4>
                            <pre className="text-sm text-gray-300 bg-dark-200/50 p-3 rounded overflow-auto">
                                {JSON.stringify(testResult, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Architecture Overview */}
                <div className="bg-gradient-to-r from-dark-100/60 to-dark-200/60 backdrop-blur-sm rounded-xl shadow-xl border border-cyber-500/30 p-6 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">🏗️ System Architecture</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold text-cyber-300 mb-4">Backend Components</h3>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3 p-3 bg-dark-200/50 rounded">
                                    <span className="text-primary-400">🐍</span>
                                    <div>
                                        <div className="font-medium text-white">FastAPI Server</div>
                                        <div className="text-sm text-gray-400">Backend/new_main.py - Main application</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-dark-200/50 rounded">
                                    <span className="text-green-400">🤖</span>
                                    <div>
                                        <div className="font-medium text-white">MCP Server</div>
                                        <div className="text-sm text-gray-400">mcp-server/ - Gemini AI integration</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-dark-200/50 rounded">
                                    <span className="text-blue-400">🗄️</span>
                                    <div>
                                        <div className="font-medium text-white">Database</div>
                                        <div className="text-sm text-gray-400">SQLite - DevOps assessment data</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-cyber-300 mb-4">Frontend Components</h3>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3 p-3 bg-dark-200/50 rounded">
                                    <span className="text-cyan-400">⚛️</span>
                                    <div>
                                        <div className="font-medium text-white">Next.js App</div>
                                        <div className="text-sm text-gray-400">React + TypeScript frontend</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-dark-200/50 rounded">
                                    <span className="text-purple-400">📊</span>
                                    <div>
                                        <div className="font-medium text-white">Chart.js</div>
                                        <div className="text-sm text-gray-400">Interactive data visualization</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-dark-200/50 rounded">
                                    <span className="text-yellow-400">🎨</span>
                                    <div>
                                        <div className="font-medium text-white">Tailwind CSS</div>
                                        <div className="text-sm text-gray-400">Modern UI styling</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Start Guide */}
                <div className="bg-dark-100/50 backdrop-blur-sm rounded-xl shadow-xl border border-gray-600/30 p-6">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">🚀 Quick Start Guide</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="text-center p-4 border border-gray-600/30 rounded-lg">
                            <div className="text-4xl mb-3">1️⃣</div>
                            <h3 className="font-semibold text-white mb-2">Take Assessment</h3>
                            <p className="text-sm text-gray-400 mb-4">Complete the DevOps culture assessment with 15 comprehensive questions</p>
                            <Link href="/devops-assessment" className="btn-primary">
                                Start Assessment
                            </Link>
                        </div>
                        <div className="text-center p-4 border border-gray-600/30 rounded-lg">
                            <div className="text-4xl mb-3">2️⃣</div>
                            <h3 className="font-semibold text-white mb-2">Get AI Insights</h3>
                            <p className="text-sm text-gray-400 mb-4">Receive personalized recommendations powered by MCP + Gemini</p>
                            <Link href="/devops-navigator" className="btn-secondary">
                                View Navigator
                            </Link>
                        </div>
                        <div className="text-center p-4 border border-gray-600/30 rounded-lg">
                            <div className="text-4xl mb-3">3️⃣</div>
                            <h3 className="font-semibold text-white mb-2">Transform Culture</h3>
                            <p className="text-sm text-gray-400 mb-4">Follow AI-generated transformation roadmaps for DevOps excellence</p>
                            <button className="btn-primary opacity-50 cursor-not-allowed">
                                Coming Soon
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

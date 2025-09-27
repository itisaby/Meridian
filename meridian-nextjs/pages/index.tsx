import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'

export default function Home() {
    const [selectedPersona, setSelectedPersona] = useState('student')

    // Animation hooks for each feature section
    const feature1 = useIntersectionObserver()
    const feature2 = useIntersectionObserver()
    const feature3 = useIntersectionObserver()

    return (
        <>
            <Head>
                <title>Meridian - Navigate Your DevOps Journey to Excellence</title>
                <meta name="description" content="Navigate DevOps transformation with AI-powered cultural intelligence - your True North for operational excellence" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-dark-200 via-dark-100 to-dark-200">
                {/* Navigation */}
                <nav className="fixed top-0 w-full z-50 bg-dark-200/80 backdrop-blur-md border-b border-cyber-500/20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center space-x-8">
                                <div className="text-2xl font-bold text-gradient">Meridian</div>
                                <div className="hidden md:flex space-x-6">
                                    <a href="#features" className="text-gray-300 hover:text-primary-400 transition-colors">Features</a>
                                    <a href="#security" className="text-gray-300 hover:text-primary-400 transition-colors">Security</a>
                                    <a href="#demo" className="text-gray-300 hover:text-primary-400 transition-colors">Demo</a>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Link href="/login">
                                    <button className="btn-secondary">Sign In</button>
                                </Link>
                                <Link href="/signup">
                                    <button className="btn-primary">Get Started</button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto text-center">
                        <div className="animate-float mb-8">
                            <h1 className="text-5xl md:text-7xl font-bold mb-6">
                                Navigate Your{' '}
                                <span className="text-gradient">DevOps</span>
                                <br />
                                Journey to{' '}
                                <span className="text-gradient">Excellence</span>
                            </h1>
                        </div>

                        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
                            AI-Powered DevOps Culture Platform that guides teams to their True North - building psychological safety,
                            accelerates learning, and creates lasting cultural transformation.
                        </p>

                        {/* Persona Selector */}
                        <div className="mb-12">
                            <p className="text-lg text-gray-400 mb-6">Choose your perspective:</p>
                            <div className="flex flex-col md:flex-row justify-center items-center gap-4 max-w-3xl mx-auto">
                                {[
                                    { id: 'student', label: 'Student', icon: '🎓', desc: 'Learn through guided projects' },
                                    { id: 'professional', label: 'Professional', icon: '👨‍💻', desc: 'Optimize complex systems' },
                                    { id: 'manager', label: 'Manager', icon: '👨‍💼', desc: 'Build high-performing teams' }
                                ].map((persona) => (
                                    <button
                                        key={persona.id}
                                        onClick={() => setSelectedPersona(persona.id)}
                                        className={`card w-full md:w-auto px-6 py-4 text-center transition-all duration-300 ${selectedPersona === persona.id
                                            ? 'border-primary-500 glow scale-105'
                                            : 'hover:border-cyber-500/40'
                                            }`}
                                    >
                                        <div className="text-2xl mb-2">{persona.icon}</div>
                                        <div className="font-semibold text-white">{persona.label}</div>
                                        <div className="text-sm text-gray-400 mt-1">{persona.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button className="btn-primary text-lg px-8 py-4">
                                Start Your DevOps Transformation
                            </button>
                            <button className="btn-secondary text-lg px-8 py-4">
                                Experience Live Demo
                            </button>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-dark-200 to-dark-100">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-20">
                            <h2 className="text-5xl md:text-7xl font-bold mb-8">
                                <span className="text-gradient">Navigate</span> Every DevOps Journey
                            </h2>
                            <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                                From your first deployment to enterprise-scale operations, Meridian serves as your compass - guiding teams toward operational excellence.
                            </p>
                        </div>

                        {/* Feature Cards - Vercel Style */}
                        <div className="space-y-32">
                            {/* AI-Powered Learning */}
                            <div
                                ref={feature1.ref}
                                className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${feature1.isInView
                                    ? 'opacity-100 translate-y-0'
                                    : 'opacity-0 translate-y-12'
                                    }`}
                            >
                                <div className="space-y-8">
                                    <div className="inline-flex items-center px-4 py-2 bg-primary-500/20 border border-primary-500/30 rounded-full">
                                        <span className="text-primary-300 font-medium">🎓 For Students & Learners</span>
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-bold">
                                        <span className="text-gradient">AI-Powered Learning</span>
                                        <br />That Adapts to You
                                    </h3>
                                    <p className="text-xl text-gray-300 leading-relaxed">
                                        Skip the tutorial hell. Meridian analyzes your code, identifies knowledge gaps, and creates personalized learning paths that get you building real projects from day one.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            'Smart skill gap detection',
                                            'Real-world project practice',
                                            'Peer mentorship matching',
                                            'Progress milestone tracking'
                                        ].map((feature, index) => (
                                            <div
                                                key={feature}
                                                className={`flex items-start space-x-3 transition-all duration-700 ${feature1.isInView
                                                    ? 'opacity-100 translate-x-0'
                                                    : 'opacity-0 -translate-x-4'
                                                    }`}
                                                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                                            >
                                                <div className="w-2 h-2 bg-primary-400 rounded-full mt-2"></div>
                                                <span className="text-gray-300">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className={`relative transition-all duration-1000 delay-300 ${feature1.isInView
                                    ? 'opacity-100 translate-x-0 scale-100'
                                    : 'opacity-0 translate-x-8 scale-95'
                                    }`}>
                                    <div className="card p-8 glow bg-gradient-to-br from-primary-500/10 to-cyber-500/10">
                                        <div className="text-6xl mb-6 animate-float">🚀</div>

                                        {/* Learning Path Demo */}
                                        <div className="space-y-4">
                                            {/* Current Project */}
                                            <div className="bg-dark-200/50 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-200">Current Project</span>
                                                    <span className="text-xs text-primary-400">67% Complete</span>
                                                </div>
                                                <div className="text-gray-300 text-sm mb-2">Building a Microservices API</div>
                                                <div className="w-full bg-dark-100 rounded-full h-2">
                                                    <div className="bg-gradient-to-r from-primary-500 to-cyber-500 h-2 rounded-full animate-pulse" style={{ width: '67%' }}></div>
                                                </div>
                                            </div>

                                            {/* Skill Analysis */}
                                            <div className="bg-dark-200/30 rounded-lg p-4">
                                                <div className="text-sm font-medium text-gray-200 mb-3">AI Skill Analysis</div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-300">Docker & Containers</span>
                                                        <div className="flex space-x-1">
                                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-300">API Design</span>
                                                        <div className="flex space-x-1">
                                                            <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                                                            <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                                                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs text-gray-300">Testing & CI/CD</span>
                                                        <div className="flex space-x-1">
                                                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Next Steps */}
                                            <div className="bg-gradient-to-r from-primary-500/20 to-cyber-500/20 rounded-lg p-4 border border-primary-500/30">
                                                <div className="text-sm font-medium text-primary-300 mb-2">🎯 Recommended Next Steps</div>
                                                <div className="space-y-1 text-xs text-gray-300">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                                                        <span>Complete Unit Testing module (15 min)</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-1.5 h-1.5 bg-cyber-400 rounded-full"></div>
                                                        <span>Practice with GitHub Actions (30 min)</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                                                        <span>Join peer review session (Thu 3pm)</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Achievement */}
                                            <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                                                <span>🏆</span>
                                                <span>Streak: 12 days</span>
                                                <span>•</span>
                                                <span>Level 7 Developer</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Professional Tools */}
                            <div
                                ref={feature2.ref}
                                className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${feature2.isInView
                                    ? 'opacity-100 translate-y-0'
                                    : 'opacity-0 translate-y-12'
                                    }`}
                            >
                                <div className={`lg:order-2 space-y-8 transition-all duration-1000 ${feature2.isInView
                                    ? 'opacity-100 translate-x-0'
                                    : 'opacity-0 translate-x-8'
                                    }`}>
                                    <div className="inline-flex items-center px-4 py-2 bg-cyber-500/20 border border-cyber-500/30 rounded-full">
                                        <span className="text-cyber-300 font-medium">👨‍💻 For Professionals</span>
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-bold">
                                        <span className="text-gradient">Root Cause Analysis</span>
                                        <br />in Seconds, Not Hours
                                    </h3>
                                    <p className="text-xl text-gray-300 leading-relaxed">
                                        Stop playing whack-a-mole with production issues. Meridian&apos;s AI navigation system traces problems to their source, suggests architectural improvements, and helps you chart a course to more resilient systems.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            'Intelligent debugging',
                                            'Performance optimization',
                                            'Architecture guidance',
                                            'Technical debt analysis'
                                        ].map((feature, index) => (
                                            <div
                                                key={feature}
                                                className={`flex items-start space-x-3 transition-all duration-700 ${feature2.isInView
                                                    ? 'opacity-100 translate-x-0'
                                                    : 'opacity-0 translate-x-4'
                                                    }`}
                                                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                                            >
                                                <div className="w-2 h-2 bg-cyber-400 rounded-full mt-2"></div>
                                                <span className="text-gray-300">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className={`lg:order-1 relative transition-all duration-1000 delay-300 ${feature2.isInView
                                    ? 'opacity-100 translate-x-0 scale-100'
                                    : 'opacity-0 -translate-x-8 scale-95'
                                    }`}>
                                    <div className="card p-8 glow bg-gradient-to-br from-cyber-500/10 to-primary-500/10">
                                        <div className="text-6xl mb-6 animate-float delay-150">⚡</div>

                                        {/* Code Analysis Demo */}
                                        <div className="bg-dark-200/80 rounded-lg p-4 mb-4 font-mono text-sm">
                                            <div className="text-red-400 mb-2">❌ Error: Database timeout (5.2s)</div>
                                            <div className="text-gray-500 mb-2">   at ConnectionPool.connect:142</div>
                                            <div className="text-yellow-400 mb-2">🔍 Analyzing dependencies...</div>
                                        </div>

                                        {/* AI Analysis */}
                                        <div className="space-y-3">
                                            <div className="flex items-start space-x-3">
                                                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse mt-1"></div>
                                                <div>
                                                    <span className="text-gray-200 font-medium">Issue: Connection Pool Exhaustion</span>
                                                    <div className="text-gray-400 text-sm">Detected pattern in 3 microservices</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse delay-150 mt-1"></div>
                                                <div>
                                                    <span className="text-gray-200 font-medium">Root Cause: Missing connection limits</span>
                                                    <div className="text-gray-400 text-sm">Analysis complete in 0.8s</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-300 mt-1"></div>
                                                <div>
                                                    <span className="text-gray-200 font-medium">Solution: Auto-scaling config ready</span>
                                                    <div className="text-gray-400 text-sm">Implementation time: ~5 minutes</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance Impact */}
                                        <div className="mt-4 pt-4 border-t border-cyber-500/20">
                                            <div className="grid grid-cols-2 gap-4 text-center">
                                                <div>
                                                    <div className="text-lg font-bold text-green-400">-92%</div>
                                                    <div className="text-xs text-gray-400">Debug Time</div>
                                                </div>
                                                <div>
                                                    <div className="text-lg font-bold text-cyber-400">+300%</div>
                                                    <div className="text-xs text-gray-400">Reliability</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Leadership Intelligence */}
                            <div
                                ref={feature3.ref}
                                className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${feature3.isInView
                                    ? 'opacity-100 translate-y-0'
                                    : 'opacity-0 translate-y-12'
                                    }`}
                            >
                                <div className={`space-y-8 transition-all duration-1000 ${feature3.isInView
                                    ? 'opacity-100 translate-x-0'
                                    : 'opacity-0 -translate-x-8'
                                    }`}>
                                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-500/20 to-cyber-500/20 border border-primary-500/30 rounded-full">
                                        <span className="text-primary-300 font-medium">👨‍💼 For Managers & Leaders</span>
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-bold">
                                        <span className="text-gradient">Team Intelligence</span>
                                        <br />Beyond Metrics
                                    </h3>
                                    <p className="text-xl text-gray-300 leading-relaxed">
                                        See beyond velocity and burndown charts. Meridian reveals team dynamics, identifies bottlenecks, and provides actionable waypoints to build psychologically safe, high-performing teams.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            'Cultural health metrics',
                                            'Capacity planning AI',
                                            'Team performance insights',
                                            'Strategic tech guidance'
                                        ].map((feature, index) => (
                                            <div
                                                key={feature}
                                                className={`flex items-start space-x-3 transition-all duration-700 ${feature3.isInView
                                                    ? 'opacity-100 translate-x-0'
                                                    : 'opacity-0 -translate-x-4'
                                                    }`}
                                                style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                                            >
                                                <div className="w-2 h-2 bg-gradient-to-r from-primary-400 to-cyber-400 rounded-full mt-2"></div>
                                                <span className="text-gray-300">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className={`relative transition-all duration-1000 delay-300 ${feature3.isInView
                                    ? 'opacity-100 translate-x-0 scale-100'
                                    : 'opacity-0 translate-x-8 scale-95'
                                    }`}>
                                    <div className="card p-8 glow bg-gradient-to-br from-primary-500/10 via-cyber-500/10 to-primary-500/5">
                                        <div className="text-6xl mb-6 animate-float delay-300">📊</div>

                                        {/* Team Dashboard Preview */}
                                        <div className="space-y-6">
                                            {/* Main Metrics */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="text-center bg-dark-200/50 rounded-lg p-3">
                                                    <div className="text-2xl font-bold text-primary-400 animate-pulse">94%</div>
                                                    <div className="text-xs text-gray-400">Team Health</div>
                                                    <div className="text-xs text-green-400 mt-1">↗ +12%</div>
                                                </div>
                                                <div className="text-center bg-dark-200/50 rounded-lg p-3">
                                                    <div className="text-2xl font-bold text-cyber-400 animate-pulse delay-150">2.3x</div>
                                                    <div className="text-xs text-gray-400">Velocity</div>
                                                    <div className="text-xs text-green-400 mt-1">↗ +130%</div>
                                                </div>
                                                <div className="text-center bg-dark-200/50 rounded-lg p-3">
                                                    <div className="text-2xl font-bold text-green-400 animate-pulse delay-300">0.1%</div>
                                                    <div className="text-xs text-gray-400">Incidents</div>
                                                    <div className="text-xs text-green-400 mt-1">↘ -89%</div>
                                                </div>
                                            </div>

                                            {/* Team Insights */}
                                            <div className="bg-dark-200/30 rounded-lg p-4">
                                                <div className="text-sm font-medium text-gray-200 mb-3">AI Insights</div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                                        <span className="text-gray-300">Sprint velocity trending up 23%</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                                        <span className="text-gray-300">Backend team at 85% capacity</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                                                        <span className="text-gray-300">Psychological safety score: Excellent</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Resource Planning */}
                                            <div className="flex justify-between items-center">
                                                <div className="text-xs text-gray-400">Next Sprint Forecast</div>
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-4 bg-primary-500/50 rounded-sm"></div>
                                                    <div className="w-2 h-6 bg-primary-500/70 rounded-sm"></div>
                                                    <div className="w-2 h-5 bg-primary-500 rounded-sm animate-pulse"></div>
                                                    <div className="w-2 h-3 bg-primary-500/30 rounded-sm"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom CTA */}
                        <div className="text-center mt-20">
                            <p className="text-xl text-gray-400 mb-8">Ready to transform your DevOps journey?</p>
                            <button className="btn-primary text-lg px-8 py-4 glow">
                                Start Your Transformation
                            </button>
                        </div>
                    </div>
                </section>

                {/* Security Section */}
                <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-100/30">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                <span className="text-gradient">Enterprise-Ready</span> Security
                            </h2>
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                                Zero-trust architecture with AI that analyzes patterns, never passwords.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                {
                                    icon: '🔒',
                                    title: 'Zero-Trust Framework',
                                    desc: 'Pattern analysis without exposing secrets'
                                },
                                {
                                    icon: '🛡️',
                                    title: 'Data Protection',
                                    desc: 'End-to-end encryption for all transmissions'
                                },
                                {
                                    icon: '🔐',
                                    title: 'Access Control',
                                    desc: 'Role-based permissions with MFA'
                                },
                                {
                                    icon: '📋',
                                    title: 'Audit & Compliance',
                                    desc: 'Complete trails for SOC 2, GDPR, HIPAA'
                                }
                            ].map((feature, index) => (
                                <div key={index} className="card text-center">
                                    <div className="text-3xl mb-4">{feature.icon}</div>
                                    <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                                    <p className="text-gray-400">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                <span className="text-gradient">Proven Results</span> Across Teams
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-4 gap-8">
                            {[
                                { value: '85%', label: 'Fewer Deployment Failures', desc: 'AI predicts and prevents issues' },
                                { value: '70%', label: 'Faster Learning', desc: 'Personalized guidance accelerates growth' },
                                { value: '60%', label: 'Time Saved', desc: 'Automated troubleshooting and solutions' },
                                { value: '90%', label: 'Better Collaboration', desc: 'Real-time knowledge sharing' }
                            ].map((stat, index) => (
                                <div key={index} className="card text-center">
                                    <div className="text-4xl font-bold text-gradient mb-2">{stat.value}</div>
                                    <h3 className="text-lg font-semibold mb-2 text-white">{stat.label}</h3>
                                    <p className="text-gray-400">{stat.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600/20 to-cyber-600/20">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Ready to Transform Your <span className="text-gradient">DevOps Culture</span>?
                        </h2>
                        <p className="text-xl text-gray-300 mb-12">
                            Join thousands of teams already using Meridian to navigate toward better software and stronger teams.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button className="btn-primary text-lg px-8 py-4 glow">
                                Start Free Trial
                            </button>
                            <button className="btn-secondary text-lg px-8 py-4">
                                Schedule Demo
                            </button>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-cyber-500/20">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gradient mb-4">Meridian</div>
                            <p className="text-gray-400 mb-4">
                                Navigate DevOps transformation to operational excellence.
                            </p>
                            <div className="flex justify-center space-x-6">
                                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Privacy</a>
                                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Terms</a>
                                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">Contact</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    )
}

import React, { useState } from 'react'
import { X, Loader2, Brain, CheckCircle, AlertCircle } from 'lucide-react'

interface Repository {
    id: string
    name: string
    full_name: string
    html_url: string
    description?: string
    language?: string
}

interface AnalysisModalProps {
    isOpen: boolean
    onClose: () => void
    repository: Repository | null
    onAnalysisComplete: () => void
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({
    isOpen,
    onClose,
    repository,
    onAnalysisComplete
}) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisStage, setAnalysisStage] = useState('')
    const [error, setError] = useState('')
    const [selectedPersona, setSelectedPersona] = useState('DevOps Engineer')

    const personas = [
        'DevOps Engineer',
        'Security Expert',
        'Software Architect',
        'Project Manager',
        'Student',
        'Startup Founder'
    ]

    const analysisStages = [
        'Initializing AI analysis...',
        'Scanning repository structure...',
        'Analyzing code patterns...',
        'Evaluating DevOps practices...',
        'Generating personalized insights...',
        'Calculating dynamic scores...',
        'Preparing recommendations...'
    ]

    const startAnalysis = async () => {
        if (!repository) return

        setIsAnalyzing(true)
        setError('')

        try {
            // Simulate analysis stages
            for (let i = 0; i < analysisStages.length; i++) {
                setAnalysisStage(analysisStages[i])
                await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
            }

            const response = await fetch('/api/ai/analyze-repository', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('meridian_token')}`
                },
                body: JSON.stringify({
                    repo_url: repository.html_url,
                    repo_full_name: repository.full_name,
                    persona: selectedPersona
                })
            })

            const data = await response.json()

            if (data.status === 'success') {
                onAnalysisComplete()
                setAnalysisStage('Analysis complete! 🎉')

                // Redirect to enhanced dashboard after 2 seconds
                setTimeout(() => {
                    window.location.href = `/enhanced-dashboard?repo=${encodeURIComponent(repository.full_name)}&persona=${encodeURIComponent(selectedPersona)}`
                }, 2000)
            } else {
                setError(data.message || 'Analysis failed')
            }

        } catch (err) {
            console.error('Analysis error:', err)
            setError('Network error occurred during analysis')
        } finally {
            setTimeout(() => {
                setIsAnalyzing(false)
                if (!error) {
                    onClose()
                }
            }, 2000)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center space-x-3">
                        <Brain className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">
                            AI Repository Analysis
                        </h2>
                    </div>
                    {!isAnalyzing && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {!isAnalyzing ? (
                        <div className="space-y-6">
                            {/* Repository Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-gray-900 mb-2">
                                    {repository?.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                    {repository?.description || 'No description available'}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span>🔧 {repository?.language || 'Unknown'}</span>
                                    <span>📊 Full Analysis</span>
                                </div>
                            </div>

                            {/* Persona Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Analysis Perspective
                                </label>
                                <select
                                    value={selectedPersona}
                                    onChange={(e) => setSelectedPersona(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {personas.map(persona => (
                                        <option key={persona} value={persona}>
                                            {persona}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Choose your role for tailored insights
                                </p>
                            </div>

                            {/* Analysis Features */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-700">
                                    This analysis will provide:
                                </h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span>Dynamic DevOps score based on your repository</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span>Tech stack specific recommendations</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span>Actionable improvement suggestions</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span>Detailed metrics breakdown</span>
                                    </li>
                                </ul>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={startAnalysis}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                            >
                                <Brain className="h-5 w-5" />
                                <span>Start AI Analysis</span>
                            </button>
                        </div>
                    ) : (
                        <div className="text-center space-y-6">
                            {/* Analysis Progress */}
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                                        <Brain className="h-6 w-6 text-blue-800 absolute inset-0 m-auto" />
                                    </div>
                                </div>

                                <h3 className="text-lg font-semibold text-gray-900">
                                    Analyzing {repository?.name}
                                </h3>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-2">Current Stage:</p>
                                    <p className="font-medium text-gray-900">{analysisStage}</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-sm text-gray-600">
                                        Using {selectedPersona} perspective
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                                    </div>
                                </div>
                            </div>

                            {analysisStage.includes('complete') && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center justify-center space-x-2">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        <p className="text-green-700 font-medium">
                                            Redirecting to detailed analysis...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
                                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

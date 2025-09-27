import React from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

interface AnalysisHistoryData {
    analysis_number: number
    overall_score: number
    ci_cd_score: number
    security_score: number
    documentation_score: number
    automation_score: number
    analysis_date: string
    persona_used: string
}

interface AnalysisChartProps {
    data: AnalysisHistoryData[]
    className?: string
}

export function AnalysisChart({ data, className = '' }: AnalysisChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className={`bg-dark-100 rounded-lg p-6 ${className}`}>
                <h3 className="text-lg font-semibold text-white mb-4">Analysis Score Trends</h3>
                <div className="flex items-center justify-center h-64 text-gray-400">
                    <div className="text-center">
                        <div className="text-4xl mb-2">📈</div>
                        <p>No analysis history available</p>
                        <p className="text-sm">Run multiple analyses to see score trends</p>
                    </div>
                </div>
            </div>
        )
    }

    const CustomTooltip = ({ active, payload, label }: {
        active?: boolean
        payload?: Array<{
            color: string
            dataKey: string
            value: number
            payload: AnalysisHistoryData
        }>
        label?: string | number
    }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-dark-200 border border-gray-600 rounded-lg p-3 shadow-lg">
                    <p className="text-white font-medium">{`Analysis #${label}`}</p>
                    <p className="text-gray-300 text-sm mb-2">
                        {new Date(data.analysis_date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-300 text-sm mb-2">
                        Persona: {data.persona_used}
                    </p>
                    {payload.map((entry, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                            {`${entry.dataKey.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div className={`bg-dark-100 rounded-lg p-6 ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white">Analysis Score Trends</h3>
                    <p className="text-gray-400 text-sm">
                        Track your repository&apos;s DevOps maturity over time
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-primary-500">
                        {data.length}
                    </div>
                    <div className="text-gray-400 text-sm">
                        Total Analyses
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                        dataKey="analysis_number"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                        tickLine={{ stroke: '#9CA3AF' }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                        tickLine={{ stroke: '#9CA3AF' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ color: '#9CA3AF' }}
                        iconType="line"
                    />

                    {/* Overall Score - Main line */}
                    <Line
                        type="monotone"
                        dataKey="overall_score"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        name="Overall Score"
                    />

                    {/* Individual metrics */}
                    <Line
                        type="monotone"
                        dataKey="ci_cd_score"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
                        name="CI/CD Score"
                    />

                    <Line
                        type="monotone"
                        dataKey="security_score"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
                        name="Security Score"
                    />

                    <Line
                        type="monotone"
                        dataKey="documentation_score"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 3 }}
                        name="Documentation Score"
                    />

                    <Line
                        type="monotone"
                        dataKey="automation_score"
                        stroke="#EF4444"
                        strokeWidth={2}
                        dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                        name="Automation Score"
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Score Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span className="text-gray-300">Overall Score</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-300">CI/CD</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-gray-300">Security</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span className="text-gray-300">Documentation</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-gray-300">Automation</span>
                </div>
            </div>
        </div>
    )
}

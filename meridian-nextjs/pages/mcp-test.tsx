import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

type MCPTool = {
  name: string;
  displayName: string;
  description: string;
  role: 'professional' | 'manager';
  parameters: string[];
};

const MCP_TOOLS: MCPTool[] = [
  {
    name: 'advanced_troubleshooting',
    displayName: 'Advanced Troubleshooting',
    description: 'AI-powered debugging and issue resolution',
    role: 'professional',
    parameters: ['repository', 'issue_description']
  },
  {
    name: 'performance_optimization',
    displayName: 'Performance Optimization',
    description: 'Code performance analysis and recommendations',
    role: 'professional',
    parameters: ['repository', 'focus_area']
  },
  {
    name: 'best_practices_audit',
    displayName: 'Best Practices Audit',
    description: 'Security, DevOps, and code quality audits',
    role: 'professional',
    parameters: ['repository', 'audit_type']
  },
  {
    name: 'advanced_learning_suggestions',
    displayName: 'Advanced Learning Suggestions',
    description: 'Personalized learning paths based on repository analysis',
    role: 'professional',
    parameters: ['repository', 'skill_focus']
  },
  {
    name: 'team_collaboration_insights',
    displayName: 'Team Collaboration Insights',
    description: 'Team productivity and collaboration analysis',
    role: 'manager',
    parameters: ['repository', 'team_size']
  },
  {
    name: 'team_learning_analysis',
    displayName: 'Team Learning Analysis',
    description: 'Skill gap identification and learning recommendations',
    role: 'manager',
    parameters: ['repositories']
  },
  {
    name: 'project_health_overview',
    displayName: 'Project Health Overview',
    description: 'Comprehensive project assessment and risk analysis',
    role: 'manager',
    parameters: ['repository', 'timeframe']
  },
  {
    name: 'resource_allocation_suggestions',
    displayName: 'Resource Allocation Suggestions',
    description: 'Team capacity planning and resource optimization',
    role: 'manager',
    parameters: ['repositories', 'upcoming_projects']
  }
];

// Test user IDs from our database
const TEST_USERS = [
  { id: '3d8ffc7c-4045-4a06-b97c-5cc01ca69538', role: 'student', name: 'Student User' },
  { id: '9c8c03dc-0abe-4448-87ef-ca19cda5caf7', role: 'professional', name: 'Professional User' },
  { id: 'f1f8a61b-13e9-49e7-a33c-cbff9fae8ff5', role: 'manager', name: 'Manager User' }
];

export default function MCPTestPage() {
  const [selectedTool, setSelectedTool] = useState<MCPTool>(MCP_TOOLS[0]);
  const [selectedUser, setSelectedUser] = useState(TEST_USERS[1]); // Default to professional
  const [parameters, setParameters] = useState<Record<string, string>>({
    repository: 'meridian-ai/sample-project',
    issue_description: 'FastAPI server returning 500 errors',
    focus_area: 'database queries',
    audit_type: 'security',
    skill_focus: 'performance optimization',
    team_size: '5',
    timeframe: '30d',
    repositories: 'repo1,repo2,repo3',
    upcoming_projects: 'New feature rollout, Performance improvements'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const canUseToolForUser = (tool: MCPTool, userRole: string): boolean => {
    if (tool.role === 'professional') {
      return ['professional', 'manager'].includes(userRole);
    }
    if (tool.role === 'manager') {
      return userRole === 'manager';
    }
    return false;
  };

  const testMCPTool = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const requestBody: any = {
        tool_name: selectedTool.name,
        user_id: selectedUser.id
      };

      // Add relevant parameters
      selectedTool.parameters.forEach(param => {
        if (parameters[param]) {
          if (param === 'repositories') {
            requestBody[param] = parameters[param].split(',').map((r: string) => r.trim());
          } else if (param === 'team_size') {
            requestBody[param] = parseInt(parameters[param] || '1');
          } else {
            requestBody[param] = parameters[param];
          }
        }
      });

      const response = await fetch('/api/mcp-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              🧭 Meridian MCP Server Test
            </h1>
            <p className="text-gray-600 mt-2">
              Test the Model Context Protocol server with AI-powered tools for Professional and Manager users
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">🛠️ Configuration</h2>
                
                {/* User Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test User
                  </label>
                  <select
                    value={selectedUser.id}
                    onChange={(e) => {
                      const user = TEST_USERS.find(u => u.id === e.target.value);
                      if (user) setSelectedUser(user);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {TEST_USERS.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tool Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MCP Tool
                  </label>
                  <select
                    value={selectedTool.name}
                    onChange={(e) => {
                      const tool = MCP_TOOLS.find(t => t.name === e.target.value);
                      if (tool) setSelectedTool(tool);
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {MCP_TOOLS.map(tool => (
                      <option key={tool.name} value={tool.name}>
                        {tool.displayName} ({tool.role})
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">{selectedTool.description}</p>
                </div>

                {/* Access Control Warning */}
                {!canUseToolForUser(selectedTool, selectedUser.role) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Access Denied: {selectedUser.role} users cannot access {selectedTool.role} tools
                    </p>
                  </div>
                )}

                {/* Parameters */}
                <div className="space-y-3">
                  {selectedTool.parameters.map(param => (
                    <div key={param}>
                      <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {param.replace(/_/g, ' ')}
                      </label>
                      <input
                        type="text"
                        value={parameters[param] || ''}
                        onChange={(e) => setParameters(prev => ({
                          ...prev,
                          [param]: e.target.value
                        }))}
                        placeholder={`Enter ${param.replace(/_/g, ' ')}`}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>

                <button
                  onClick={testMCPTool}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? '🔄 Testing MCP Tool...' : '🚀 Test MCP Tool'}
                </button>
              </div>
            </div>

            {/* Results Panel */}
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">📊 Results</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800">❌ Error: {error}</p>
                </div>
              )}

              {result && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-green-800">✅ MCP Tool Execution Successful</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Tool:</strong> {result.tool}</p>
                    <p><strong>User Role:</strong> {result.user_role}</p>
                    <p><strong>Response Length:</strong> {result.response_length} characters</p>
                    <p><strong>Execution Time:</strong> {result.execution_time}ms</p>
                  </div>
                  
                  <div className="bg-white rounded p-3 mt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">AI Response Preview:</h4>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{result.preview}</p>
                  </div>
                </div>
              )}

              {!result && !error && !loading && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <p className="text-gray-500">Select a tool and user, then click "Test MCP Tool" to see results</p>
                </div>
              )}
            </div>
          </div>

          {/* MCP Server Status */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">🔧 MCP Server Status</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800">Professional Tools</h4>
                <p className="text-blue-600 text-sm">4 tools available</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800">Manager Tools</h4>
                <p className="text-purple-600 text-sm">4 tools available</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800">AI Integration</h4>
                <p className="text-green-600 text-sm">Gemini AI ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

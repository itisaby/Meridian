import type { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';

type MCPToolRequest = {
    tool_name: string;
    user_id: string;
    repository?: string;
    issue_description?: string;
    focus_area?: string;
    audit_type?: string;
    skill_focus?: string;
    team_size?: number;
    timeframe?: string;
    repositories?: string[];
    upcoming_projects?: string;
};

type MCPResponse = {
    success: boolean;
    data?: any;
    error?: string;
    execution_time?: number;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<MCPResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const {
            tool_name,
            user_id,
            repository,
            issue_description,
            focus_area,
            audit_type,
            skill_focus,
            team_size,
            timeframe,
            repositories,
            upcoming_projects
        }: MCPToolRequest = req.body;

        if (!tool_name || !user_id) {
            return res.status(400).json({
                success: false,
                error: 'tool_name and user_id are required'
            });
        }

        const startTime = Date.now();

        // Create MCP request JSON
        const mcpRequest = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
                name: tool_name,
                arguments: {
                    user_id,
                    ...(repository && { repository }),
                    ...(issue_description && { issue_description }),
                    ...(focus_area && { focus_area }),
                    ...(audit_type && { audit_type }),
                    ...(skill_focus && { skill_focus }),
                    ...(team_size && { team_size }),
                    ...(timeframe && { timeframe }),
                    ...(repositories && { repositories }),
                    ...(upcoming_projects && { upcoming_projects })
                }
            }
        };

        // Call MCP server
        const mcpResult = await callMCPServer(mcpRequest);
        const executionTime = Date.now() - startTime;

        if (mcpResult.error) {
            return res.status(500).json({
                success: false,
                error: mcpResult.error,
                execution_time: executionTime
            });
        }

        return res.status(200).json({
            success: true,
            data: mcpResult.result,
            execution_time: executionTime
        });

    } catch (error) {
        console.error('MCP API Error:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}

async function callMCPServer(request: any): Promise<{ result?: any; error?: string }> {
    return new Promise((resolve) => {
        const mcpServerPath = path.join(process.cwd(), '../mcp-server/server.py');

        // Spawn Python process to run MCP server
        const python = spawn('python3.13', [mcpServerPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                PYTHONPATH: path.join(process.cwd(), '../mcp-server'),
                GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'your-gemini-api-key-here',
                MERIDIAN_BACKEND_URL: 'http://localhost:8000',
                MERIDIAN_DB_PATH: path.join(process.cwd(), '../Backend/meridian.db')
            }
        });

        let output = '';
        let errorOutput = '';

        // Send MCP request
        python.stdin.write(JSON.stringify(request) + '\n');
        python.stdin.end();

        python.stdout.on('data', (data) => {
            output += data.toString();
        });

        python.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        python.on('close', (code) => {
            if (code !== 0) {
                resolve({ error: `MCP server exited with code ${code}: ${errorOutput}` });
                return;
            }

            try {
                // Parse MCP response
                const lines = output.trim().split('\n');
                const lastLine = lines[lines.length - 1];

                if (lastLine.startsWith('{')) {
                    const response = JSON.parse(lastLine);
                    resolve({ result: response });
                } else {
                    resolve({ error: `Invalid MCP response: ${output}` });
                }
            } catch (parseError) {
                resolve({ error: `Failed to parse MCP response: ${parseError}` });
            }
        });

        python.on('error', (error) => {
            resolve({ error: `Failed to start MCP server: ${error.message}` });
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            python.kill();
            resolve({ error: 'MCP server timeout' });
        }, 30000);
    });
}

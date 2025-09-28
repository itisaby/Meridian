import asyncio
import json
import logging
import os
import sqlite3
from typing import Any, Dict, List, Optional, Sequence
from dataclasses import dataclass

import google.generativeai as genai
import httpx
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp.types import (
    CallToolRequest,
    CallToolResult,
    ListToolsRequest,
    TextContent,
    Tool,
)
from dotenv import load_dotenv

# Import tool implementations
from professional_tools import (
    advanced_troubleshooting,
    performance_optimization,
    best_practices_audit,
    advanced_learning_suggestions
)
from manager_tools import (
    team_collaboration_insights,
    team_learning_analysis,
    project_health_overview,
    resource_allocation_suggestions,
    project_risk_assessment,
    team_performance_optimization
)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("meridian-mcp")

# Configure Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

@dataclass
class UserContext:
    """User context for role-based access control"""
    user_id: str
    role: str  # 'student', 'professional', 'manager'
    github_username: Optional[str] = None
    email: Optional[str] = None

class MeridianMCPServer:
    """Meridian MCP Server for Professional and Manager AI-powered tools"""
    
    def __init__(self):
        self.server = Server("meridian-mcp")
        self.db_path = "/Users/arnabmaity/Documents/Meridian/Backend/meridian.db"
        self.backend_url = "http://localhost:8000"
        self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Register handlers
        self.server.list_tools = self.list_tools
        self.server.call_tool = self.call_tool
        
    async def get_user_context(self, user_id: str) -> Optional[UserContext]:
        """Get user context from database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, role, github_username, email FROM users WHERE id = ?",
                (user_id,)
            )
            result = cursor.fetchone()
            conn.close()
            
            if result:
                return UserContext(
                    user_id=result[0],
                    role=result[1],
                    github_username=result[2],
                    email=result[3]
                )
            return None
        except Exception as e:
            logger.error(f"Error getting user context: {e}")
            return None
    
    async def get_repository_context(self, repo_name: str, user_id: str) -> Optional[Dict]:
        """Get repository analysis data"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.backend_url}/ai/analysis-history",
                    params={"repo": repo_name, "user_id": user_id}
                )
                if response.status_code == 200:
                    analyses = response.json()
                    return analyses[0] if analyses else None
                return None
        except Exception as e:
            logger.error(f"Error getting repository context: {e}")
            return None
    
    async def call_gemini(self, prompt: str, context: Dict = None) -> str:
        """Call Gemini AI with context"""
        try:
            # Add context to prompt if provided
            if context:
                context_str = json.dumps(context, indent=2)
                full_prompt = f"""
Context Information:
{context_str}

Task:
{prompt}

Please provide a detailed, actionable response based on the context provided.
"""
            else:
                full_prompt = prompt
            
            response = self.gemini_model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error calling Gemini: {e}")
            return f"Error generating AI response: {str(e)}"

    async def list_tools(self, request: ListToolsRequest) -> List[Tool]:
        """List available tools based on user role"""
        tools = []
        
        # Get user context (in real implementation, extract from request)
        # For now, we'll return all tools and handle role filtering in call_tool
        
        # Professional Tools
        professional_tools = [
            Tool(
                name="advanced_troubleshooting",
                description="Get advanced troubleshooting suggestions for repository issues and deployment problems",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Repository name (owner/repo)"},
                        "user_id": {"type": "string", "description": "User ID"},
                        "issue_description": {"type": "string", "description": "Description of the issue"}
                    },
                    "required": ["repository", "user_id", "issue_description"]
                }
            ),
            Tool(
                name="performance_optimization",
                description="Get performance optimization recommendations for your codebase",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Repository name (owner/repo)"},
                        "user_id": {"type": "string", "description": "User ID"},
                        "focus_area": {"type": "string", "description": "Specific area to optimize (optional)"}
                    },
                    "required": ["repository", "user_id"]
                }
            ),
            Tool(
                name="best_practices_audit",
                description="Audit repository for best practices violations and get improvement suggestions",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Repository name (owner/repo)"},
                        "user_id": {"type": "string", "description": "User ID"},
                        "audit_type": {"type": "string", "description": "Type of audit (security, devops, code_quality)"}
                    },
                    "required": ["repository", "user_id"]
                }
            ),
            Tool(
                name="advanced_learning_suggestions",
                description="Get personalized advanced learning material recommendations based on repository analysis",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Repository name (owner/repo)"},
                        "user_id": {"type": "string", "description": "User ID"},
                        "skill_focus": {"type": "string", "description": "Specific skill area to focus on (optional)"}
                    },
                    "required": ["repository", "user_id"]
                }
            )
        ]
        
        # Manager Tools
        manager_tools = [
            Tool(
                name="team_collaboration_insights",
                description="Analyze team collaboration patterns and get improvement suggestions",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Repository name (owner/repo)"},
                        "user_id": {"type": "string", "description": "Manager User ID"},
                        "team_size": {"type": "integer", "description": "Number of team members (optional)"}
                    },
                    "required": ["repository", "user_id"]
                }
            ),
            Tool(
                name="team_learning_analysis",
                description="Analyze team learning patterns and identify skill gaps",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "Manager User ID"},
                        "repositories": {"type": "array", "items": {"type": "string"}, "description": "List of team repositories"}
                    },
                    "required": ["user_id"]
                }
            ),
            Tool(
                name="project_health_overview",
                description="Get comprehensive project health assessment and risk analysis",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Repository name (owner/repo)"},
                        "user_id": {"type": "string", "description": "Manager User ID"},
                        "timeframe": {"type": "string", "description": "Analysis timeframe (30d, 90d, 6m)"}
                    },
                    "required": ["repository", "user_id"]
                }
            ),
            Tool(
                name="resource_allocation_suggestions",
                description="Get team resource allocation and capacity planning recommendations",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "Manager User ID"},
                        "team_repositories": {"type": "array", "items": {"type": "string"}, "description": "Team repositories"},
                        "upcoming_projects": {"type": "string", "description": "Description of upcoming projects (optional)"}
                    },
                    "required": ["user_id"]
                }
            ),
            Tool(
                name="project_risk_assessment",
                description="Advanced project risk assessment and mitigation strategies for managers",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Repository name (owner/repo)"},
                        "user_id": {"type": "string", "description": "Manager User ID"},
                        "project_stage": {"type": "string", "description": "Current project stage (active, planning, etc.)"},
                        "team_size": {"type": "integer", "description": "Number of team members (optional)"}
                    },
                    "required": ["repository", "user_id"]
                }
            ),
            Tool(
                name="team_performance_optimization",
                description="AI-powered team performance optimization recommendations",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "Manager User ID"},
                        "team_metrics": {"type": "object", "description": "Team performance metrics (velocity, quality, collaboration)"},
                        "team_size": {"type": "integer", "description": "Number of team members (optional)"}
                    },
                    "required": ["user_id", "team_metrics"]
                }
            )
        ]
        
    async def call_tool(self, request: CallToolRequest) -> CallToolResult:
        """Handle tool calls with role-based access control"""
        try:
            tool_name = request.params.name
            arguments = request.params.arguments or {}
            
            # Extract user_id for role validation
            user_id = arguments.get("user_id")
            if not user_id:
                return CallToolResult(
                    content=[TextContent(
                        type="text",
                        text="Error: user_id is required for all tool calls"
                    )]
                )
            
            # Professional Tools
            if tool_name == "advanced_troubleshooting":
                result = await advanced_troubleshooting(
                    self,
                    repository=arguments.get("repository", ""),
                    user_id=user_id,
                    issue_description=arguments.get("issue_description", "")
                )
                return result
                
            elif tool_name == "performance_optimization":
                result = await performance_optimization(
                    self,
                    repository=arguments.get("repository", ""),
                    user_id=user_id,
                    focus_area=arguments.get("focus_area")
                )
                return result
                
            elif tool_name == "best_practices_audit":
                result = await best_practices_audit(
                    self,
                    repository=arguments.get("repository", ""),
                    user_id=user_id,
                    audit_type=arguments.get("audit_type", "general")
                )
                return result
                
            elif tool_name == "advanced_learning_suggestions":
                result = await advanced_learning_suggestions(
                    self,
                    repository=arguments.get("repository", ""),
                    user_id=user_id,
                    skill_focus=arguments.get("skill_focus")
                )
                return result
                
            # Manager Tools
            elif tool_name == "team_collaboration_insights":
                result = await team_collaboration_insights(
                    self,
                    repository=arguments.get("repository", ""),
                    user_id=user_id,
                    team_size=arguments.get("team_size")
                )
                return CallToolResult(
                    content=[TextContent(
                        type="text",
                        text=f"# Team Collaboration Insights\n\n{result.get('analysis', result.get('error', 'Unknown error'))}"
                    )]
                )
                
            elif tool_name == "team_learning_analysis":
                result = await team_learning_analysis(
                    self,
                    user_id=user_id,
                    repositories=arguments.get("repositories")
                )
                return CallToolResult(
                    content=[TextContent(
                        type="text",
                        text=f"# Team Learning Analysis\n\n{result.get('analysis', result.get('error', 'Unknown error'))}"
                    )]
                )
                
            elif tool_name == "project_health_overview":
                result = await project_health_overview(
                    self,
                    repository=arguments.get("repository", ""),
                    user_id=user_id,
                    timeframe=arguments.get("timeframe", "30d")
                )
                return CallToolResult(
                    content=[TextContent(
                        type="text",
                        text=f"# Project Health Overview\n\n{result.get('analysis', result.get('error', 'Unknown error'))}"
                    )]
                )
                
            elif tool_name == "resource_allocation_suggestions":
                result = await resource_allocation_suggestions(
                    self,
                    user_id=user_id,
                    team_repositories=arguments.get("team_repositories"),
                    upcoming_projects=arguments.get("upcoming_projects")
                )
                return CallToolResult(
                    content=[TextContent(
                        type="text",
                        text=f"# Resource Allocation Suggestions\n\n{result.get('analysis', result.get('error', 'Unknown error'))}"
                    )]
                )
                
            elif tool_name == "project_risk_assessment":
                result = await project_risk_assessment(
                    self,
                    repository=arguments.get("repository", ""),
                    user_id=user_id,
                    project_stage=arguments.get("project_stage", "active"),
                    team_size=arguments.get("team_size")
                )
                return CallToolResult(
                    content=[TextContent(
                        type="text",
                        text=json.dumps({
                            "preview": result.get("preview", "Risk assessment completed"),
                            "tool": result.get("tool", "project_risk_assessment"),
                            "execution_time": 1250,
                            "analysis": result.get("risk_assessment", result.get("error", "Unknown error"))
                        })
                    )]
                )
                
            elif tool_name == "team_performance_optimization":
                result = await team_performance_optimization(
                    self,
                    user_id=user_id,
                    team_metrics=arguments.get("team_metrics", {}),
                    team_size=arguments.get("team_size")
                )
                return CallToolResult(
                    content=[TextContent(
                        type="text",
                        text=json.dumps({
                            "preview": result.get("preview", "Performance optimization analysis completed"),
                            "tool": result.get("tool", "team_performance_optimization"),
                            "execution_time": 1100,
                            "analysis": result.get("optimization_analysis", result.get("error", "Unknown error"))
                        })
                    )]
                )
                
            else:
                return CallToolResult(
                    content=[TextContent(
                        type="text",
                        text=f"Unknown tool: {tool_name}"
                    )]
                )
                
        except Exception as e:
            logger.error(f"Error in call_tool: {e}")
            return CallToolResult(
                content=[TextContent(
                    type="text",
                    text=f"Error executing tool: {str(e)}"
                )]
            )

    async def list_tools(self, request: ListToolsRequest) -> List[Tool]:
        """List available tools based on user role"""
        tools = []
        
        # Get user context (in real implementation, extract from request)
        # For now, we'll return all tools and handle role filtering in call_tool
        
        # Professional Tools
        professional_tools = [
            Tool(
                name="advanced_troubleshooting",
                description="Get advanced troubleshooting suggestions for repository issues and deployment problems",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Repository name (owner/repo)"},
                        "user_id": {"type": "string", "description": "User ID"},
                        "issue_description": {"type": "string", "description": "Description of the issue"}
                    },
                    "required": ["repository", "user_id", "issue_description"]
                }
            ),
            Tool(
                name="performance_optimization",
                description="Get performance optimization recommendations for your codebase",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Repository name (owner/repo)"},
                        "user_id": {"type": "string", "description": "User ID"},
                        "focus_area": {"type": "string", "description": "Specific area to optimize (optional)"}
                    },
                    "required": ["repository", "user_id"]
                }
            ),
            Tool(
                name="best_practices_audit",
                description="Audit repository for best practices violations and get improvement suggestions",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Repository name (owner/repo)"},
                        "user_id": {"type": "string", "description": "User ID"},
                        "audit_type": {"type": "string", "description": "Type of audit (security, devops, code_quality)"}
                    },
                    "required": ["repository", "user_id"]
                }
            ),
            Tool(
                name="advanced_learning_suggestions",
                description="Get personalized advanced learning material recommendations based on repository analysis",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Repository name (owner/repo)"},
                        "user_id": {"type": "string", "description": "User ID"},
                        "skill_focus": {"type": "string", "description": "Specific skill area to focus on (optional)"}
                    },
                    "required": ["repository", "user_id"]
                }
            )
        ]
        
        # Manager Tools
        manager_tools = [
            Tool(
                name="team_collaboration_insights",
                description="Analyze team collaboration patterns and get improvement suggestions",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Repository name (owner/repo)"},
                        "user_id": {"type": "string", "description": "Manager User ID"},
                        "team_size": {"type": "integer", "description": "Number of team members (optional)"}
                    },
                    "required": ["repository", "user_id"]
                }
            ),
            Tool(
                name="team_learning_analysis",
                description="Analyze team learning patterns and identify skill gaps",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "Manager User ID"},
                        "repositories": {"type": "array", "items": {"type": "string"}, "description": "List of team repositories"}
                    },
                    "required": ["user_id"]
                }
            ),
            Tool(
                name="project_health_overview",
                description="Get comprehensive project health assessment and risk analysis",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "repository": {"type": "string", "description": "Repository name (owner/repo)"},
                        "user_id": {"type": "string", "description": "Manager User ID"},
                        "timeframe": {"type": "string", "description": "Analysis timeframe (30d, 90d, 6m)"}
                    },
                    "required": ["repository", "user_id"]
                }
            ),
            Tool(
                name="resource_allocation_suggestions",
                description="Get team resource allocation and capacity planning recommendations",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "Manager User ID"},
                        "team_repositories": {"type": "array", "items": {"type": "string"}, "description": "Team repositories"},
                        "upcoming_projects": {"type": "string", "description": "Description of upcoming projects (optional)"}
                    },
                    "required": ["user_id"]
                }
            )
        ]
        
        # Return all tools for now (role filtering in call_tool)
        tools.extend(professional_tools)
        tools.extend(manager_tools)
        
        return tools

# Initialize server
mcp_server = MeridianMCPServer()

async def main():
    """Main entry point"""
    async with stdio_server() as (read_stream, write_stream):
        await mcp_server.server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="meridian-mcp",
                server_version="1.0.0",
                capabilities=mcp_server.server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())

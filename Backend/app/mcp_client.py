"""
MCP Client for AI-powered DevOps Culture Assessment
Connects to MCP server for Gemini AI-powered assessments and guidance
"""
import asyncio
import json
import httpx
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)

class MCPDevOpsClient:
    """Client for MCP DevOps Culture Tools"""
    
    def __init__(self, mcp_server_url: str = "http://localhost:3001"):
        self.mcp_server_url = mcp_server_url
        self.client = httpx.AsyncClient()
    
    async def assess_devops_culture(self, user_id: str, assessment_responses: Dict[str, int], user_history: List[Dict] = None) -> Dict[str, Any]:
        """
        Call MCP server for AI-powered DevOps culture assessment
        """
        try:
            payload = {
                "user_id": user_id,
                "assessment_responses": assessment_responses,
                "user_history": user_history or [],
                "analysis_type": "comprehensive"
            }
            
            logger.info(f"Calling MCP server for DevOps assessment: {self.mcp_server_url}/devops/assess")
            
            response = await self.client.post(
                f"{self.mcp_server_url}/devops/assess",
                json=payload,
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"MCP assessment successful for user {user_id}")
                return result
            else:
                logger.error(f"MCP server error: {response.status_code} - {response.text}")
                return {"error": f"MCP server error: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Failed to connect to MCP server: {e}")
            return {"error": f"MCP connection failed: {str(e)}"}
    
    async def generate_personalized_questions(self, user_id: str, skill_level: str, user_history: List[Dict], focus_areas: List[str] = None) -> Dict[str, Any]:
        """
        Generate personalized questions based on user history and skill level
        """
        try:
            payload = {
                "user_id": user_id,
                "current_level": skill_level,
                "user_history": user_history,
                "question_count": 15
            }
            
            logger.info(f"Calling MCP server for personalized questions: {self.mcp_server_url}/devops/generate-questions")
            
            response = await self.client.post(
                f"{self.mcp_server_url}/devops/generate-questions",
                json=payload,
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"MCP personalized questions successful for user {user_id}")
                return result
            else:
                logger.error(f"MCP server error for questions: {response.status_code} - {response.text}")
                return {"error": f"MCP server error: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Failed to generate personalized questions: {e}")
            return {"error": f"MCP connection failed: {str(e)}"}
    
    async def get_ai_guidance(self, user_id: str, assessment_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Get personalized AI guidance based on assessment results
        """
        try:
            payload = {
                "user_id": user_id,
                "assessment_result": assessment_result
            }
            
            response = await self.client.post(
                f"{self.mcp_server_url}/devops/guidance",
                json=payload,
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return result
            else:
                logger.error(f"Failed to get AI guidance: {response.status_code}")
                return {"error": f"AI guidance failed: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Failed to get AI guidance: {e}")
            return {"error": f"AI guidance failed: {str(e)}"}
    
    async def generate_roadmap(self, user_id: str, assessment_id: str, current_scores: Dict[str, int]) -> Dict[str, Any]:
        """
        Generate transformation roadmap using AI
        """
        try:
            payload = {
                "user_id": user_id,
                "assessment_id": assessment_id,
                "current_scores": current_scores
            }
            
            response = await self.client.post(
                f"{self.mcp_server_url}/devops/roadmap",
                json=payload,
                timeout=30.0
            )
            
            if response.status_code == 200:
                result = response.json()
                return result
            else:
                logger.error(f"Failed to generate roadmap: {response.status_code}")
                return {"error": f"Roadmap generation failed: {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Failed to generate roadmap: {e}")
            return {"error": f"Roadmap generation failed: {str(e)}"}
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

# Global MCP client instance
mcp_client = MCPDevOpsClient()

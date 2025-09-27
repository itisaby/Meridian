"""
Analysis and AI service routes
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from ..models import AnalysisRequest
from ..database import DatabaseManager
from ..services import AIService, MCPClient
from .auth import extract_token_from_header, get_user_from_token


router = APIRouter(prefix="/analyze", tags=["analysis"])

# Initialize services
ai_service = AIService()
mcp_client = MCPClient()


@router.post("/")
async def analyze_repository(analysis_request: AnalysisRequest, authorization: str = Header(None)):
    """Analyze repository with AI and MCP services"""
    # Authenticate user
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        # Get repository data
        repo_data = DatabaseManager.get_repository_by_id(analysis_request.repo_id)
        if not repo_data:
            raise HTTPException(status_code=404, detail="Repository not found")
        
        # Check if user owns the repository
        if repo_data["user_id"] != user_data["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get repository analysis from MCP
        repo_analysis = await mcp_client.call_tool(
            "github",
            "analyze_repository",
            {"repo_url": repo_data["repo_url"]}
        )
        
        # Get personalized learning path
        learning_path = await mcp_client.call_tool(
            "learning",
            "generate_learning_path",
            {
                "persona": analysis_request.persona,
                "repo_data": repo_analysis,
                "user_skills": user_data["skills"]
            }
        )
        
        # Combine with AI analysis
        ai_analysis = await ai_service.analyze_with_persona(
            repo_data=repo_analysis,
            persona=analysis_request.persona,
            context={
                "user_role": user_data["role"],
                "user_skills": user_data["skills"],
                "learning_path": learning_path
            }
        )
        
        # Combine all analysis data
        complete_analysis = {
            "repo_analysis": repo_analysis,
            "learning_path": learning_path,
            "ai_insights": ai_analysis,
            "persona": analysis_request.persona,
            "analyzed_at": "2025-09-26T02:00:00Z"
        }
        
        # Update repository with analysis data
        DatabaseManager.update_repository_analysis(
            analysis_request.repo_id,
            complete_analysis
        )
        
        return {
            "message": "Analysis completed successfully",
            "repo_id": analysis_request.repo_id,
            "analysis": complete_analysis
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

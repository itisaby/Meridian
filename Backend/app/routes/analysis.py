"""
Analysis and AI service routes
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from ..models import AnalysisRequest
from ..database import DatabaseManager
from ..services import AIService, MCPClient
from ..services.repo_analyzer import repo_analyzer
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
        
        # Get GitHub access token for repository analysis
        github_token = user_data.get("github_access_token")
        if not github_token:
            raise HTTPException(status_code=400, detail="GitHub access token required for analysis")
        
        # Analyze repository files and patterns
        repo_analysis = await repo_analyzer.analyze_repository_files(
            repo_url=repo_data["repo_url"],
            github_token=github_token
        )
        
        if "error" in repo_analysis:
            raise HTTPException(status_code=400, detail=repo_analysis["error"])
        
        # Get AI-powered suggestions using Gemini
        ai_analysis = await ai_service.analyze_with_persona(
            repo_data=repo_data,
            persona=analysis_request.persona,
            context={
                "repo_files": repo_analysis.get("repo_files", {}),
                "user_context": {
                    "role": user_data.get("role", ""),
                    "skills": user_data.get("skills", []),
                    "experience_level": user_data.get("experience_level", "beginner")
                },
                "devops_analysis": repo_analysis.get("devops_analysis", {})
            }
        )
        
        # Combine all analysis data
        complete_analysis = {
            "repo_analysis": repo_analysis,
            "ai_insights": ai_analysis,
            "persona": analysis_request.persona,
            "devops_score": ai_analysis.get("devops_score", 0),
            "suggestions": ai_analysis.get("suggestions", []),
            "analysis_summary": ai_analysis.get("analysis_summary", "Analysis completed"),
            "analyzed_at": ai_analysis.get("generated_at", "2025-09-27T18:00:00Z")
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

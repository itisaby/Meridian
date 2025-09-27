"""
AI Testing Route for Gemini Integration
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from pydantic import BaseModel

from ..services.gemini_service import gemini_service
from ..services.repo_analyzer import repo_analyzer
from .auth import extract_token_from_header, get_user_from_token

router = APIRouter(prefix="/ai", tags=["ai-testing"])


class AITestRequest(BaseModel):
    repo_url: str
    persona: str = "Professional"


@router.post("/test-suggestions")
async def test_ai_suggestions(request: AITestRequest, authorization: str = Header(None)):
    """Test AI suggestions generation with Gemini"""
    try:
        # Authenticate user
        token = extract_token_from_header(authorization)
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = get_user_from_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get GitHub token
        github_token = user_data.get("github_access_token")
        if not github_token:
            raise HTTPException(status_code=400, detail="GitHub access token required")
        
        # Mock repository data for testing
        mock_repo_data = {
            "name": "test-repo",
            "description": "A test repository for AI analysis", 
            "language": "Python",
            "stars": 10,
            "forks": 2,
            "private": False
        }
        
        # Mock repository files for testing
        mock_repo_files = {
            "README.md": "# Test Repository\n\nA simple test repository for DevOps analysis.",
            "app.py": "from flask import Flask\napp = Flask(__name__)\n\nif __name__ == '__main__':\n    app.run()",
            "requirements.txt": "flask==2.3.0\nrequests==2.31.0",
            ".github/workflows/test.yml": "name: Test\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest"
        }
        
        # Test Gemini analysis
        ai_analysis = await gemini_service.analyze_repository_with_persona(
            repo_data=mock_repo_data,
            repo_files=mock_repo_files,
            persona=request.persona,
            user_context={"role": "developer", "experience": "intermediate"}
        )
        
        return {
            "message": "AI analysis test completed",
            "persona": request.persona,
            "analysis": ai_analysis,
            "test_status": "success"
        }
        
    except Exception as e:
        return {
            "message": "AI analysis test failed",
            "error": str(e),
            "test_status": "failed"
        }


@router.get("/health")
async def ai_health_check():
    """Check if AI services are available"""
    try:
        # Test if Gemini is configured
        import os
        gemini_key = os.getenv("GEMINI_API_KEY")
        
        return {
            "gemini_configured": bool(gemini_key and gemini_key != "your_gemini_api_key_here"),
            "services_available": True,
            "status": "healthy"
        }
    except Exception as e:
        return {
            "gemini_configured": False,
            "services_available": False,
            "status": "unhealthy",
            "error": str(e)
        }

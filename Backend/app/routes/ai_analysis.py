"""
Enhanced AI Analysis Routes with SQLite Integration
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from ..services.ai_analysis_service_sqlite import ai_analysis_service
from .auth import extract_token_from_header, get_user_from_token

router = APIRouter(prefix="/ai", tags=["ai-analysis"])


class AnalysisRequest(BaseModel):
    repo_url: str
    repo_full_name: str  # e.g., "owner/repo"
    persona: str = "DevOps Engineer"


class AnalysisResponse(BaseModel):
    status: str
    message: str
    analysis: Optional[Dict[str, Any]] = None
    is_cached: bool = False


@router.post("/analyze-repository", response_model=AnalysisResponse)
async def analyze_repository(
    request: AnalysisRequest, 
    authorization: str = Header(None)
):
    """
    Perform comprehensive AI analysis of a repository with dynamic scoring
    """
    try:
        # Authenticate user
        token = extract_token_from_header(authorization)
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = get_user_from_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get("id")  # Changed from "user_id" to "id"
        github_token = user_data.get("github_access_token")
        
        # Perform AI analysis
        result = await ai_analysis_service.analyze_repository(
            user_id=user_id,
            repo_url=request.repo_url,
            repo_full_name=request.repo_full_name,
            persona=request.persona,
            github_token=github_token
        )
        
        return AnalysisResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/repository-analysis/{repo_full_name}")
async def get_repository_analysis(
    repo_full_name: str,
    authorization: str = Header(None)
):
    """
    Get the latest analysis for a specific repository
    """
    try:
        # Authenticate user
        token = extract_token_from_header(authorization)
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = get_user_from_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get("id")
        
        # Get latest analysis
        analysis = ai_analysis_service.get_latest_analysis(
            user_id, repo_full_name.replace("__", "/")  # Handle URL encoding
        )
        
        if not analysis:
            return {
                "status": "no_analysis",
                "message": "No analysis found for this repository",
                "analysis": None
            }
        
        return {
            "status": "success",
            "message": "Analysis retrieved",
            "analysis": analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve analysis: {str(e)}")


@router.get("/user-analyses")
async def get_user_analyses(
    authorization: str = Header(None)
):
    """
    Get all repository analyses for the authenticated user
    """
    try:
        # Authenticate user
        token = extract_token_from_header(authorization)
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = get_user_from_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get("id")
        
        # Get user analyses
        analyses = ai_analysis_service.get_user_analyses(user_id)
        
        return {
            "status": "success",
            "message": f"Retrieved {len(analyses)} analyses",
            "analyses": analyses
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve analyses: {str(e)}")


@router.delete("/analysis/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    authorization: str = Header(None)
):
    """
    Delete a specific analysis
    """
    try:
        # Authenticate user
        token = extract_token_from_header(authorization)
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = get_user_from_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get("id")
        
        # Delete analysis
        success = ai_analysis_service.delete_analysis(user_id, analysis_id)
        
        if success:
            return {
                "status": "success",
                "message": "Analysis deleted successfully"
            }
        else:
            return {
                "status": "error",
                "message": "Analysis not found or access denied"
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete analysis: {str(e)}")


@router.get("/enhanced-dashboard/{repo_full_name:path}")
async def get_enhanced_dashboard_data(
    repo_full_name: str,
    authorization: str = Header(None)
):
    """
    Get comprehensive dashboard data for a specific repository
    """
    try:
        # Authenticate user
        token = extract_token_from_header(authorization)
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = get_user_from_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get("id")
        
        # Get stored analysis for this repository
        user_analyses = ai_analysis_service.get_user_analyses(user_id)
        repo_analysis = None
        
        for analysis in user_analyses:
            if analysis.get('repository_full_name') == repo_full_name:
                repo_analysis = analysis
                break
        
        if repo_analysis:
            # Extract metrics from the stored analysis
            metrics = repo_analysis.get('metrics', {})
            devops_score = repo_analysis.get('devops_score', 0)
            
            # Create enhanced metrics response
            enhanced_metrics = {
                'overall_score': int(devops_score),
                'ci_cd_score': int(metrics.get('ci_cd_score', max(0, devops_score - 10))),
                'security_score': int(metrics.get('security_score', max(0, devops_score - 5))),
                'documentation_score': int(metrics.get('documentation_score', max(0, devops_score - 15))),
                'automation_score': int(metrics.get('code_quality_score', metrics.get('testing_score', max(0, devops_score - 8)))),
                'repositories_analyzed': 1,
                'total_repositories': 1,
                'has_analysis': True
            }
            
            return {
                "status": "success",
                "repository_full_name": repo_full_name,
                "metrics": enhanced_metrics,
                "analysis": repo_analysis,
                "analysis_date": repo_analysis.get('created_at')
            }
        else:
            return {
                "status": "success", 
                "repository_full_name": repo_full_name,
                "metrics": {
                    'overall_score': 0,
                    'ci_cd_score': 0,
                    'security_score': 0,
                    'documentation_score': 0,
                    'automation_score': 0,
                    'repositories_analyzed': 0,
                    'total_repositories': 1,
                    'has_analysis': False
                },
                "analysis": None,
                "analysis_date": None
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard data: {str(e)}")


@router.get("/analysis-history/{repo_full_name:path}")
async def get_analysis_history(
    repo_full_name: str,
    authorization: str = Header(None)
):
    """
    Get historical analysis data for score trends
    """
    try:
        # Authenticate user
        token = extract_token_from_header(authorization)
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        user_data = get_user_from_token(token)
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_data.get("id")
        
        # Get all analyses for this repository (for future when we have multiple analyses)
        user_analyses = ai_analysis_service.get_user_analyses(user_id)
        repo_analyses = [
            analysis for analysis in user_analyses 
            if analysis.get('repository_full_name') == repo_full_name
        ]
        
        # Format for chart data
        history_data = []
        for i, analysis in enumerate(repo_analyses):
            devops_score = analysis.get('devops_score', 0)
            metrics = analysis.get('metrics', {})
            
            history_data.append({
                'analysis_number': i + 1,
                'overall_score': int(devops_score),
                'ci_cd_score': int(metrics.get('ci_cd_score', max(0, devops_score - 10))),
                'security_score': int(metrics.get('security_score', max(0, devops_score - 5))),
                'documentation_score': int(metrics.get('documentation_score', max(0, devops_score - 15))),
                'automation_score': int(metrics.get('code_quality_score', metrics.get('testing_score', max(0, devops_score - 8)))),
                'analysis_date': analysis.get('created_at'),
                'persona_used': analysis.get('persona_used', 'DevOps Engineer')
            })
        
        return {
            "status": "success",
            "repository_full_name": repo_full_name,
            "history": history_data,
            "total_analyses": len(history_data)
        }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analysis history: {str(e)}")


# Keep the legacy test endpoint for backward compatibility
@router.post("/test-suggestions")
async def test_ai_suggestions_legacy(request: dict, authorization: str = Header(None)):
    """Legacy endpoint for testing - redirects to new analysis"""
    try:
        # Extract repo info from URL
        repo_url = request.get("repo_url", "")
        if "github.com/" in repo_url:
            repo_full_name = repo_url.split("github.com/")[-1].rstrip("/")
        else:
            repo_full_name = "test/repo"
        
        # Create new request
        analysis_request = AnalysisRequest(
            repo_url=repo_url,
            repo_full_name=repo_full_name,
            persona=request.get("persona", "DevOps Engineer")
        )
        
        # Use new analysis endpoint
        result = await analyze_repository(analysis_request, authorization)
        
        # Return in legacy format
        return {
            "message": "AI analysis test completed",
            "persona": request.get("persona", "DevOps Engineer"),
            "analysis": result.analysis,
            "test_status": "success" if result.status == "success" else "failed"
        }
        
    except Exception as e:
        return {
            "message": "AI analysis test failed",
            "error": str(e),
            "test_status": "failed"
        }

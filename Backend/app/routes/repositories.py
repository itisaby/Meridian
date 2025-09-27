"""
Repository management routes
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
import uuid

from ..models import Repository, RepositoryResponse
from ..database import DatabaseManager
from .auth import extract_token_from_header, get_user_from_token


router = APIRouter(prefix="/repositories", tags=["repositories"])


@router.post("/", response_model=RepositoryResponse)
async def create_repository(repository: Repository, authorization: str = Header(None)):
    """Create a new repository for analysis"""
    # Authenticate user
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        # Extract repo name from URL (simple extraction)
        repo_name = repository.repo_url.split("/")[-1].replace(".git", "")
        
        # Create repository record
        repo_id = DatabaseManager.create_repository(
            user_id=user_data["id"],
            repo_url=repository.repo_url,
            repo_name=repo_name
        )
        
        # Get the created repository
        repo_data = DatabaseManager.get_repository_by_id(repo_id)
        if not repo_data:
            raise HTTPException(status_code=500, detail="Failed to create repository")
        
        return RepositoryResponse(
            id=repo_data["id"],
            user_id=repo_data["user_id"],
            repo_url=repo_data["repo_url"],
            repo_name=repo_data["repo_name"],
            analysis_data=repo_data["analysis_data"],
            created_at=repo_data["created_at"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Repository creation failed: {str(e)}")


@router.get("/{repo_id}", response_model=RepositoryResponse)
async def get_repository(repo_id: str, authorization: str = Header(None)):
    """Get repository by ID"""
    # Authenticate user
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Get repository
    repo_data = DatabaseManager.get_repository_by_id(repo_id)
    if not repo_data:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Check if user owns the repository
    if repo_data["user_id"] != user_data["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return RepositoryResponse(
        id=repo_data["id"],
        user_id=repo_data["user_id"],
        repo_url=repo_data["repo_url"],
        repo_name=repo_data["repo_name"],
        analysis_data=repo_data["analysis_data"],
        created_at=repo_data["created_at"]
    )


@router.get("/{repo_id}/analysis")
async def get_repository_analysis(repo_id: str, authorization: str = Header(None)):
    """Get repository analysis results"""
    # Authenticate user
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Get repository
    repo_data = DatabaseManager.get_repository_by_id(repo_id)
    if not repo_data:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Check if user owns the repository
    if repo_data["user_id"] != user_data["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if not repo_data["analysis_data"]:
        raise HTTPException(status_code=404, detail="No analysis data found")
    
    return {
        "repo_id": repo_id,
        "analysis": repo_data["analysis_data"],
        "created_at": repo_data["created_at"]
    }

"""
Repository management routes
"""
from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from typing import Optional, List
import uuid
import json

from ..models import Repository, RepositoryResponse
from ..database import DatabaseManager
from ..services.github_service import GitHubService
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


@router.get("/", response_model=List[RepositoryResponse])
async def get_user_repositories(authorization: str = Header(None)):
    """Get all repositories for the authenticated user"""
    # Authenticate user
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        # Get user repositories from database
        repositories = DatabaseManager.get_user_repositories(user_data["id"])
        
        return [
            RepositoryResponse(
                id=repo["id"],
                user_id=repo["user_id"],
                repo_url=repo["repo_url"],
                repo_name=repo["repo_name"],
                analysis_data=repo["analysis_data"],
                created_at=repo["created_at"]
            )
            for repo in repositories
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch repositories: {str(e)}")


@router.get("/github/sync")
async def sync_github_repositories(authorization: str = Header(None)):
    """Sync repositories from GitHub"""
    # Authenticate user
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Get user's GitHub access token
    if not user_data.get("github_access_token"):
        raise HTTPException(status_code=400, detail="GitHub access token not found")
    
    try:
        github_service = GitHubService(user_data["github_access_token"])
        github_repos = github_service.get_user_repositories()
        
        synced_repos = []
        for repo in github_repos:
            # Check if repository already exists
            existing_repo = DatabaseManager.get_repository_by_url(user_data["id"], repo["clone_url"])
            
            if not existing_repo:
                # Create new repository record
                repo_id = DatabaseManager.create_repository(
                    user_id=user_data["id"],
                    repo_url=repo["clone_url"],
                    repo_name=repo["name"],
                    github_data=repo
                )
                
                synced_repos.append({
                    "id": repo_id,
                    "name": repo["name"],
                    "url": repo["clone_url"],
                    "status": "added"
                })
            else:
                synced_repos.append({
                    "id": existing_repo["id"],
                    "name": repo["name"],
                    "url": repo["clone_url"],
                    "status": "exists"
                })
        
        return {
            "synced_repositories": synced_repos,
            "total_synced": len(synced_repos),
            "message": f"Successfully synced {len(synced_repos)} repositories"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub sync failed: {str(e)}")


@router.post("/{repo_id}/analyze")
async def analyze_repository(repo_id: str, background_tasks: BackgroundTasks, authorization: str = Header(None)):
    """Analyze repository for DevOps patterns"""
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
    
    # Get user's GitHub access token
    if not user_data.get("github_access_token"):
        raise HTTPException(status_code=400, detail="GitHub access token not found")
    
    try:
        # Parse GitHub URL to get owner and repo name
        repo_url = repo_data["repo_url"]
        if "github.com" in repo_url:
            url_parts = repo_url.replace("https://github.com/", "").replace(".git", "").split("/")
            if len(url_parts) >= 2:
                owner, repo_name = url_parts[0], url_parts[1]
            else:
                raise HTTPException(status_code=400, detail="Invalid GitHub repository URL")
        else:
            raise HTTPException(status_code=400, detail="Only GitHub repositories are supported")
        
        # Add analysis task to background
        background_tasks.add_task(
            analyze_repository_background,
            repo_id,
            owner,
            repo_name,
            user_data["github_access_token"]
        )
        
        return {
            "message": "Repository analysis started",
            "repo_id": repo_id,
            "status": "analyzing"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


async def analyze_repository_background(repo_id: str, owner: str, repo_name: str, access_token: str):
    """Background task to analyze repository"""
    try:
        github_service = GitHubService(access_token)
        analysis_results = github_service.analyze_devops_patterns(owner, repo_name)
        
        # Store analysis results in database
        DatabaseManager.update_repository_analysis(repo_id, analysis_results)
        
        print(f"Analysis completed for repository {repo_id}")
        
    except Exception as e:
        print(f"Background analysis failed for repository {repo_id}: {str(e)}")


@router.get("/github/repos")
async def get_github_repositories(authorization: str = Header(None)):
    """Get user's GitHub repositories directly from GitHub API"""
    # Authenticate user
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    # Get user's GitHub access token
    if not user_data.get("github_access_token"):
        raise HTTPException(status_code=400, detail="GitHub access token not found")
    
    try:
        github_service = GitHubService(user_data["github_access_token"])
        repositories = github_service.get_user_repositories()
        
        # Format repositories for frontend
        formatted_repos = []
        for repo in repositories:
            formatted_repos.append({
                "id": repo.get("id"),
                "name": repo.get("name"),
                "full_name": repo.get("full_name"),
                "description": repo.get("description"),
                "clone_url": repo.get("clone_url"),
                "html_url": repo.get("html_url"),
                "language": repo.get("language"),
                "stars": repo.get("stargazers_count", 0),
                "forks": repo.get("forks_count", 0),
                "updated_at": repo.get("updated_at"),
                "private": repo.get("private", False)
            })
        
        return {
            "repositories": formatted_repos,
            "total_count": len(formatted_repos)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch GitHub repositories: {str(e)}")

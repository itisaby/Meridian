"""
Authentication related routes
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from datetime import datetime
import sqlite3

from ..models import UserLogin, UserSignup, UserResponse, AuthResponse
from ..database import DatabaseManager


router = APIRouter(prefix="/auth", tags=["authentication"])


def extract_token_from_header(authorization: str = Header(None)) -> Optional[str]:
    """Extract token from Authorization header"""
    if authorization and authorization.startswith("Bearer "):
        return authorization.split("Bearer ")[1]
    return None


def get_user_from_token(token: str) -> Optional[dict]:
    """Get user from token (simplified token validation)"""
    if not token or not token.startswith("meridian_token_"):
        return None
    
    user_id = token.replace("meridian_token_", "")
    return DatabaseManager.get_user_by_id(user_id)


@router.post("/signup", response_model=AuthResponse)
async def signup(user_data: UserSignup):
    """Create a new user account"""
    try:
        # Check if user already exists
        existing_user = DatabaseManager.get_user_by_email(user_data.email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        user_id = DatabaseManager.create_user(
            name=user_data.name,
            email=user_data.email,
            role=user_data.role,
            skills=[]
        )
        
        # Get the created user
        user_data_dict = DatabaseManager.get_user_by_id(user_id)
        if not user_data_dict:
            raise HTTPException(status_code=500, detail="Failed to create user")
        
        # Create user response
        user_response = UserResponse(
            id=user_id,
            name=user_data_dict["name"],
            email=user_data_dict["email"],
            role=user_data_dict["role"],
            skills=user_data_dict["skills"],
            created_at=user_data_dict["created_at"] if isinstance(user_data_dict["created_at"], str) else datetime.now().isoformat()
        )
        
        # Generate token (in production, use proper JWT!)
        token = f"meridian_token_{user_id}"
        
        return AuthResponse(user=user_response, token=token)
        
    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")


@router.post("/login", response_model=AuthResponse)
async def login(login_data: UserLogin):
    """Authenticate user and return token"""
    try:
        # Get user by email
        user_data_dict = DatabaseManager.get_user_by_email(login_data.email)
        
        if not user_data_dict:
            # Create demo users if they don't exist
            demo_users = [
                ("demo_student_id", "Demo Student", "student@demo.com", "student"),
                ("demo_dev_id", "Demo Developer", "dev@demo.com", "professional"), 
                ("demo_manager_id", "Demo Manager", "manager@demo.com", "manager")
            ]
            
            for demo_id, demo_name, demo_email, demo_role in demo_users:
                if login_data.email == demo_email:
                    DatabaseManager.create_demo_user(demo_id, demo_name, demo_email, demo_role)
                    user_data_dict = {
                        "id": demo_id,
                        "name": demo_name,
                        "email": demo_email,
                        "role": demo_role,
                        "skills": [],
                        "created_at": datetime.now().isoformat()
                    }
                    break
            
            if not user_data_dict:
                raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create user response
        user_response = UserResponse(
            id=user_data_dict["id"],
            name=user_data_dict["name"],
            email=user_data_dict["email"],
            role=user_data_dict["role"],
            skills=user_data_dict["skills"],
            created_at=user_data_dict["created_at"] if isinstance(user_data_dict["created_at"], str) else datetime.now().isoformat()
        )
        
        # Generate token (in production, use proper JWT!)
        token = f"meridian_token_{user_data_dict['id']}"
        
        return AuthResponse(user=user_response, token=token)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: str = Header(None)):
    """Get current authenticated user"""
    token = extract_token_from_header(authorization)
    
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return UserResponse(
        id=user_data["id"],
        name=user_data["name"],
        email=user_data["email"],
        role=user_data["role"],
        skills=user_data["skills"],
        created_at=user_data["created_at"] if isinstance(user_data["created_at"], str) else datetime.now().isoformat()
    )


@router.post("/logout")
async def logout():
    """Logout user (token invalidation handled client-side)"""
    return {"message": "Successfully logged out"}


@router.put("/role")
async def update_user_role(role_data: dict, authorization: str = Header(None)):
    """Update user role"""
    token = extract_token_from_header(authorization)
    
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    new_role = role_data.get("role")
    if not new_role:
        raise HTTPException(status_code=400, detail="Role is required")
    
    try:
        DatabaseManager.update_user_role(user_data["id"], new_role)
        return {"message": "Role updated successfully", "role": new_role}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update role: {str(e)}")


@router.post("/github", response_model=AuthResponse)
async def github_auth(github_data: dict):
    """Authenticate or create user from GitHub OAuth"""
    try:
        github_id = github_data.get("githubId")
        username = github_data.get("username")
        name = github_data.get("name")
        email = github_data.get("email")
        avatar_url = github_data.get("avatarUrl")
        bio = github_data.get("bio")
        location = github_data.get("location")
        company = github_data.get("company")
        blog = github_data.get("blog")
        public_repos = github_data.get("publicRepos", 0)
        followers = github_data.get("followers", 0)
        following = github_data.get("following", 0)
        access_token = github_data.get("accessToken")
        user_role = github_data.get("role")  # New: Get role from request
        
        if not github_id or not username:
            raise HTTPException(status_code=400, detail="Missing required GitHub data")
        
        # Check if user exists by GitHub ID
        existing_user = DatabaseManager.get_user_by_github_id(github_id)
        
        if existing_user:
            # Update existing user with latest GitHub data
            user_id = existing_user["id"]
            DatabaseManager.update_user_github_data(
                user_id=user_id,
                username=username,
                name=name or username,
                email=email,
                avatar_url=avatar_url,
                bio=bio,
                location=location,
                company=company,
                blog=blog,
                public_repos=public_repos,
                followers=followers,
                following=following,
                access_token=access_token
            )
            
            # Update role if provided
            if user_role:
                DatabaseManager.update_user_role(user_id, user_role)
        else:
            # Create new user from GitHub data
            user_id = DatabaseManager.create_user_from_github(
                github_id=github_id,
                username=username,
                name=name or username,
                email=email,
                avatar_url=avatar_url,
                bio=bio,
                location=location,
                company=company,
                blog=blog,
                public_repos=public_repos,
                followers=followers,
                following=following,
                access_token=access_token,
                role=user_role or "professional"  # Default to professional if no role provided
            )
        
        # Get updated user data
        user_data_dict = DatabaseManager.get_user_by_id(user_id)
        if not user_data_dict:
            raise HTTPException(status_code=500, detail="Failed to retrieve user data")
        
        # Create response
        user_response = UserResponse(
            id=user_data_dict["id"],
            name=user_data_dict["name"],
            email=user_data_dict["email"] or "",
            role=user_data_dict["role"],
            skills=user_data_dict.get("skills", []),
            created_at=user_data_dict["created_at"]
        )
        
        token = f"meridian_token_{user_id}"
        
        return AuthResponse(user=user_response, token=token)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub authentication failed: {str(e)}")

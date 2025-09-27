"""
Profile API endpoints for user profile management
"""
import os
import uuid
import shutil
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Header
from fastapi.responses import FileResponse

from app.models.profile import (
    UserProfile, Skill, LearningGoal, ProfileResponse, ProfileStatsResponse,
    CreateProfileRequest, UpdateProfileRequest, AddSkillRequest, UpdateSkillRequest,
    CreateLearningGoalRequest, UpdateLearningGoalRequest
)
from app.services.profile_service import ProfileService
from app.routes.auth import extract_token_from_header, get_user_from_token

# Initialize router
router = APIRouter(prefix="/profiles", tags=["profiles"])

# Initialize profile service
profile_service = ProfileService("meridian.db")

# Avatar upload settings
AVATAR_UPLOAD_DIR = "uploads/avatars"
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

# Ensure upload directory exists
os.makedirs(AVATAR_UPLOAD_DIR, exist_ok=True)

# Auth dependency
def get_current_user_id(authorization: str = Header(None)) -> str:
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="No authorization token provided")
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return user_data['id']

@router.post("/", response_model=UserProfile)
async def create_profile(
    profile_data: CreateProfileRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new user profile"""
    try:
        # Check if profile already exists
        existing_profile = profile_service.get_profile(user_id)
        if existing_profile:
            raise HTTPException(status_code=400, detail="Profile already exists for this user")
        
        profile = profile_service.create_profile(user_id, profile_data.dict())
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create profile: {str(e)}")

@router.get("/me", response_model=UserProfile)
async def get_my_profile(user_id: str = Depends(get_current_user_id)):
    """Get current user's profile"""
    profile = profile_service.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.get("/me/complete", response_model=ProfileResponse)
async def get_complete_profile(user_id: str = Depends(get_current_user_id)):
    """Get complete profile with skills and learning goals"""
    profile_data = profile_service.get_complete_profile(user_id)
    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile_data

@router.get("/me/stats", response_model=ProfileStatsResponse)
async def get_profile_stats(user_id: str = Depends(get_current_user_id)):
    """Get profile statistics"""
    stats = profile_service.get_profile_stats(user_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Profile not found")
    return stats

@router.put("/me", response_model=UserProfile)
async def update_profile(
    profile_data: UpdateProfileRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Update current user's profile"""
    try:
        profile = profile_service.update_profile(user_id, profile_data.dict(exclude_unset=True))
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

# Avatar endpoints
@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    """Upload user avatar"""
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # Validate file size
    if file.size > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_AVATAR_SIZE // (1024*1024)}MB"
        )
    
    try:
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if file.filename else 'jpg'
        filename = f"{user_id}_{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(AVATAR_UPLOAD_DIR, filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Update profile with avatar URL
        avatar_url = f"/profiles/avatars/{filename}"
        profile_service.update_profile(user_id, {"avatar_url": avatar_url})
        
        return {
            "message": "Avatar uploaded successfully",
            "avatar_url": avatar_url,
            "filename": filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload avatar: {str(e)}")

@router.get("/avatars/{filename}")
async def get_avatar(filename: str):
    """Serve avatar image"""
    file_path = os.path.join(AVATAR_UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Avatar not found")
    return FileResponse(file_path)

# Skills endpoints
@router.post("/me/skills", response_model=Skill)
async def add_skill(
    skill_data: AddSkillRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Add a skill to user profile"""
    try:
        skill = profile_service.add_skill(user_id, skill_data.dict())
        return skill
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add skill: {str(e)}")

@router.get("/me/skills", response_model=List[Skill])
async def get_my_skills(user_id: str = Depends(get_current_user_id)):
    """Get current user's skills"""
    skills = profile_service.get_user_skills(user_id)
    return skills

@router.put("/me/skills/{skill_id}", response_model=Skill)
async def update_skill(
    skill_id: int,
    skill_data: UpdateSkillRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Update a skill"""
    try:
        skill = profile_service.update_skill(user_id, skill_id, skill_data.dict(exclude_unset=True))
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
        return skill
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update skill: {str(e)}")

@router.delete("/me/skills/{skill_id}")
async def delete_skill(
    skill_id: int,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a skill"""
    try:
        success = profile_service.delete_skill(user_id, skill_id)
        if not success:
            raise HTTPException(status_code=404, detail="Skill not found")
        return {"message": "Skill deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete skill: {str(e)}")

# Learning goals endpoints
@router.post("/me/goals", response_model=LearningGoal)
async def create_learning_goal(
    goal_data: CreateLearningGoalRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Create a learning goal"""
    try:
        goal = profile_service.create_learning_goal(user_id, goal_data.dict())
        return goal
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create goal: {str(e)}")

@router.get("/me/goals", response_model=List[LearningGoal])
async def get_my_learning_goals(user_id: str = Depends(get_current_user_id)):
    """Get current user's learning goals"""
    goals = profile_service.get_user_learning_goals(user_id)
    return goals

@router.put("/me/goals/{goal_id}", response_model=LearningGoal)
async def update_learning_goal(
    goal_id: int,
    goal_data: UpdateLearningGoalRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Update a learning goal"""
    try:
        goal = profile_service.update_learning_goal(user_id, goal_id, goal_data.dict(exclude_unset=True))
        if not goal:
            raise HTTPException(status_code=404, detail="Learning goal not found")
        return goal
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update goal: {str(e)}")

@router.delete("/me/goals/{goal_id}")
async def delete_learning_goal(
    goal_id: int,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a learning goal"""
    try:
        success = profile_service.delete_learning_goal(user_id, goal_id)
        if not success:
            raise HTTPException(status_code=404, detail="Learning goal not found")
        return {"message": "Learning goal deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete goal: {str(e)}")

# Utility endpoints
@router.get("/skill-categories")
async def get_skill_categories():
    """Get available skill categories"""
    return {
        "categories": [
            "programming", "devops", "cloud", "database", "frontend", 
            "backend", "mobile", "ai_ml", "cybersecurity", "testing", "other"
        ]
    }

@router.get("/goal-categories")
async def get_goal_categories():
    """Get available goal categories"""
    return {
        "categories": [
            "skill", "certification", "project", "career", "education", "other"
        ]
    }

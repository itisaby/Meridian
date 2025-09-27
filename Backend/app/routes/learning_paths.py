"""
Learning Paths API Routes
Provides endpoints for personalized learning journeys based on repository analysis
"""
from fastapi import APIRouter, HTTPException, Header, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import uuid
import sqlite3

from ..services.learning_paths_service import learning_paths_service, UserLearningGoal, UserProgress
from ..services.ai_analysis_service_sqlite import ai_analysis_service
from .auth import extract_token_from_header, get_user_from_token

router = APIRouter(prefix="/learning-paths", tags=["learning-paths"])


class CreateLearningGoalRequest(BaseModel):
    title: str
    description: str
    target_completion_date: str
    priority: str  # 'high', 'medium', 'low'
    category: str
    current_skill_level: str  # 'beginner', 'intermediate', 'advanced'
    target_skill_level: str
    motivation: str


class UpdateProgressRequest(BaseModel):
    learning_path_id: str
    module_id: str
    resource_id: Optional[str] = None
    time_spent_minutes: int
    notes: Optional[str] = None
    completed: bool = False


@router.post("/generate-from-analysis/{analysis_id}")
async def generate_learning_paths_from_analysis(
    analysis_id: str,
    authorization: str = Header(None)
):
    """
    Generate personalized learning paths based on AI repository analysis
    This is the core feature that transforms AI suggestions into structured learning journeys
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
        
        # Get the AI analysis
        user_analyses = ai_analysis_service.get_user_analyses(user_id)
        analysis = None
        
        for user_analysis in user_analyses:
            if user_analysis.get('id') == analysis_id:
                analysis = user_analysis
                break
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # Generate learning paths from analysis
        learning_paths = learning_paths_service.create_learning_path_from_analysis(analysis, user_id)
        
        # Save learning paths to database
        saved_paths = []
        for path in learning_paths:
            if learning_paths_service.save_learning_path(path):
                saved_paths.append({
                    'id': path.id,
                    'title': path.title,
                    'description': path.description,
                    'category': path.category,
                    'difficulty_level': path.difficulty_level,
                    'total_estimated_hours': path.total_estimated_hours,
                    'modules_count': len(path.modules)
                })
        
        return {
            "status": "success",
            "message": f"Generated {len(saved_paths)} learning paths from analysis",
            "learning_paths": saved_paths,
            "analysis_id": analysis_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting learning path: {str(e)}")

@router.post("/goals")
async def create_learning_goal(goal_data: dict):
    """Create a new learning goal"""
    try:
        # Create UserLearningGoal object
        goal = UserLearningGoal(
            id=str(uuid.uuid4()),
            user_id=goal_data["user_id"],
            title=goal_data["title"],
            description=goal_data["description"],
            target_completion_date=goal_data.get("target_completion_date"),
            priority=goal_data.get("priority", "medium"),
            category=goal_data.get("category", "general"),
            current_skill_level=goal_data.get("current_skill_level", "beginner"),
            target_skill_level=goal_data.get("target_skill_level", "intermediate"),
            motivation=goal_data.get("motivation", ""),
            status="active",
            created_at=datetime.now().isoformat()
        )
        
        success = learning_paths_service.save_learning_goal(goal)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save learning goal")
        
        return goal.__dict__
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating learning goal: {str(e)}")

@router.get("/goals")
async def get_learning_goals(user_id: str):
    """Get learning goals for a user"""
    try:
        conn = sqlite3.connect(learning_paths_service.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM user_learning_goals 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        """, (user_id,))
        
        results = cursor.fetchall()
        conn.close()
        
        goals = []
        for row in results:
            goals.append({
                'id': row[0],
                'user_id': row[1],
                'title': row[2],
                'description': row[3],
                'target_completion_date': row[4],
                'priority': row[5],
                'category': row[6],
                'current_skill_level': row[7],
                'target_skill_level': row[8],
                'motivation': row[9],
                'status': row[10],
                'created_at': row[11],
                'updated_at': row[12]
            })
        
        return goals
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching learning goals: {str(e)}")


@router.get("/user-paths")
async def get_user_learning_paths(
    authorization: str = Header(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """
    Get all learning paths for the authenticated user
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
        
        # Get user's learning paths
        learning_paths = learning_paths_service.get_user_learning_paths(user_id)
        
        # Apply filters
        if category:
            learning_paths = [lp for lp in learning_paths if lp['category'].lower() == category.lower()]
        
        if status:
            learning_paths = [lp for lp in learning_paths if lp['progress_status'] == status]
        
        return {
            "status": "success",
            "learning_paths": learning_paths,
            "total_count": len(learning_paths)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get learning paths: {str(e)}")


@router.get("/path/{path_id}")
async def get_learning_path_details(
    path_id: str,
    authorization: str = Header(None)
):
    """
    Get detailed information about a specific learning path including modules and resources
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
        
        # Get learning path details
        path_details = learning_paths_service.get_learning_path_by_id(path_id)
        
        if not path_details:
            raise HTTPException(status_code=404, detail="Learning path not found")
        
        # Get user's progress for this path
        user_progress = learning_paths_service.get_user_progress(user_id, path_id)
        
        return {
            "status": "success",
            "learning_path": path_details,
            "user_progress": user_progress
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get learning path details: {str(e)}")


@router.post("/goals")
async def create_learning_goal(
    request: CreateLearningGoalRequest,
    authorization: str = Header(None)
):
    """
    Create a new learning goal for the user
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
        
        # Create learning goal
        goal = UserLearningGoal(
            id=f"goal_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{user_id[:8]}",
            user_id=user_id,
            title=request.title,
            description=request.description,
            target_completion_date=request.target_completion_date,
            priority=request.priority,
            category=request.category,
            current_skill_level=request.current_skill_level,
            target_skill_level=request.target_skill_level,
            motivation=request.motivation,
            created_at=datetime.now().isoformat()
        )
        
        # Save to database
        if learning_paths_service.save_learning_goal(goal):
            return {
                "status": "success",
                "message": "Learning goal created successfully",
                "goal_id": goal.id
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save learning goal")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create learning goal: {str(e)}")


@router.post("/progress/update")
async def update_learning_progress(
    request: UpdateProgressRequest,
    authorization: str = Header(None)
):
    """
    Update user's progress through a learning path
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
        
        # Update progress
        success = learning_paths_service.update_user_progress(
            user_id=user_id,
            learning_path_id=request.learning_path_id,
            module_id=request.module_id,
            resource_id=request.resource_id,
            time_spent_minutes=request.time_spent_minutes,
            notes=request.notes,
            completed=request.completed
        )
        
        if success:
            # Get updated progress
            updated_progress = learning_paths_service.get_user_progress(user_id, request.learning_path_id)
            
            return {
                "status": "success",
                "message": "Progress updated successfully",
                "updated_progress": updated_progress
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update progress")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")


@router.get("/resources/search")
async def search_learning_resources(
    query: str = Query(..., description="Search query for learning resources"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty level"),
    authorization: str = Header(None)
):
    """
    Search for learning resources using web search and curated databases
    This will be enhanced with real web search integration
    """
    try:
        # Authenticate user
        token = extract_token_from_header(authorization)
        if not token:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # For now, return mock data - will be enhanced with real search
        mock_resources = [
            {
                "id": "resource_1",
                "title": f"Complete Guide to {query}",
                "description": f"Comprehensive tutorial covering all aspects of {query}",
                "resource_type": "article",
                "url": "https://example.com/guide",
                "difficulty_level": "beginner",
                "estimated_time_minutes": 45,
                "rating": 4.5,
                "source": "documentation",
                "tags": [query.lower(), "tutorial", "guide"]
            },
            {
                "id": "resource_2",
                "title": f"{query} Video Tutorial",
                "description": f"Step-by-step video walkthrough of {query}",
                "resource_type": "video",
                "url": "https://youtube.com/watch?v=example",
                "difficulty_level": "intermediate",
                "estimated_time_minutes": 30,
                "rating": 4.8,
                "source": "youtube",
                "tags": [query.lower(), "video", "walkthrough"]
            }
        ]
        
        return {
            "status": "success",
            "query": query,
            "resources": mock_resources,
            "total_results": len(mock_resources)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search resources: {str(e)}")


@router.get("/dashboard-summary")
async def get_learning_dashboard_summary(
    authorization: str = Header(None)
):
    """
    Get summary data for learning paths dashboard integration
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
        
        # Get summary statistics
        learning_paths = learning_paths_service.get_user_learning_paths(user_id)
        
        # Calculate summary metrics
        total_paths = len(learning_paths)
        in_progress = len([lp for lp in learning_paths if lp['progress_status'] == 'in_progress'])
        completed = len([lp for lp in learning_paths if lp['progress_status'] == 'completed'])
        not_started = len([lp for lp in learning_paths if lp['progress_status'] == 'not_started'])
        
        # Calculate average progress
        total_progress = sum([lp['progress_percentage'] for lp in learning_paths])
        average_progress = total_progress / total_paths if total_paths > 0 else 0
        
        # Get recent activity
        recent_paths = learning_paths[:3]  # Most recent 3 paths
        
        return {
            "status": "success",
            "summary": {
                "total_learning_paths": total_paths,
                "paths_in_progress": in_progress,
                "paths_completed": completed,
                "paths_not_started": not_started,
                "average_progress_percentage": round(average_progress, 1),
                "total_estimated_hours": sum([lp['total_estimated_hours'] for lp in learning_paths])
            },
            "recent_paths": recent_paths,
            "categories": list(set([lp['category'] for lp in learning_paths]))
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard summary: {str(e)}")

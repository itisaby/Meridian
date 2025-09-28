from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import sqlite3
import json
import logging

router = APIRouter(prefix="/professional", tags=["professional"])
logger = logging.getLogger(__name__)

DB_PATH = "meridian.db"

def get_db_connection():
    """Get database connection"""
    return sqlite3.connect(DB_PATH)

@router.get("/dashboard/{user_id}")
async def get_professional_dashboard(user_id: str):
    """Get comprehensive dashboard data for a professional user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First verify user exists and has professional role
        cursor.execute("SELECT id, name, email, role FROM users WHERE id = ? AND role = 'professional'", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Professional user not found")
        
        user_data = {
            "id": user[0],
            "name": user[1], 
            "email": user[2],
            "role": user[3]
        }
        
        # Get manager information
        cursor.execute("""
            SELECT m.id, m.name, m.email, m.role 
            FROM professional_managers pm
            JOIN users m ON pm.manager_id = m.id
            WHERE pm.professional_id = ? AND pm.is_active = 1
        """, (user_id,))
        manager = cursor.fetchone()
        manager_data = None
        if manager:
            manager_data = {
                "id": manager[0],
                "name": manager[1],
                "email": manager[2],
                "role": manager[3]
            }
        
        # Get projects this professional is working on with repository details
        cursor.execute("""
            SELECT p.id, p.name, p.description, p.status, p.priority, 
                   p.repository_url, p.created_at, p.updated_at,
                   pa.role as project_role, pa.assigned_at,
                   COUNT(DISTINCT pa2.professional_id) as team_count
            FROM project_assignments pa
            JOIN projects p ON pa.project_id = p.id  
            LEFT JOIN project_assignments pa2 ON pa2.project_id = p.id AND pa2.is_active = 1
            WHERE pa.professional_id = ? AND pa.is_active = 1
            GROUP BY p.id, p.name, p.description, p.status, p.priority, 
                     p.repository_url, p.created_at, p.updated_at,
                     pa.role, pa.assigned_at
        """, (user_id,))
        
        projects = []
        for row in cursor.fetchall():
            project_id = row[0]
            
            # Get repositories for this project that the professional is assigned to
            cursor.execute("""
                SELECT pr.id, pr.repository_name, pr.repository_url, pr.description, 
                       pr.technology_stack, pr.primary_language, pr.is_primary,
                       ra.role as repo_role
                FROM project_repositories pr
                LEFT JOIN repository_assignments ra ON pr.id = ra.repository_id AND ra.professional_id = ?
                WHERE pr.project_id = ? AND pr.is_active = TRUE
                ORDER BY pr.is_primary DESC, pr.repository_name
            """, (user_id, project_id))
            
            repositories = []
            for repo_row in cursor.fetchall():
                repositories.append({
                    "id": repo_row[0],
                    "repository_name": repo_row[1],
                    "repository_url": repo_row[2],
                    "description": repo_row[3],
                    "technology_stack": repo_row[4],
                    "primary_language": repo_row[5],
                    "is_primary": repo_row[6],
                    "my_role": repo_row[7]  # Role in this specific repository
                })
            
            project = {
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "status": row[3],
                "priority": row[4],
                "repository_url": row[5],  # Keep for backward compatibility
                "created_at": row[6],
                "updated_at": row[7],
                "my_role": row[8],  # Overall project role
                "joined_at": row[9],
                "team_count": row[10],
                "repositories": repositories  # New: detailed repository info
            }
            projects.append(project)
        
        # Get recent activities
        cursor.execute("""
            SELECT activity_type, project_id, description, created_at
            FROM professional_activities 
            WHERE professional_id = ?
            ORDER BY created_at DESC
            LIMIT 20
        """, (user_id,))
        
        activities = []
        for row in cursor.fetchall():
            activities.append({
                "activity_type": row[0],
                "project_id": row[1], 
                "description": row[2],
                "created_at": row[3]
            })
        
        # Get overall statistics
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT pa.project_id) as total_projects,
                SUM(cm.commits_count) as total_commits,
                AVG(cm.commits_count) as avg_commits_per_week
            FROM project_assignments pa
            LEFT JOIN collaboration_metrics cm ON pa.professional_id = cm.professional_id AND pa.project_id = cm.project_id
            WHERE pa.professional_id = ? AND pa.is_active = 1
        """, (user_id,))
        
        stats_row = cursor.fetchone()
        stats = {
            "total_projects": stats_row[0] if stats_row[0] else 0,
            "total_commits": stats_row[1] if stats_row[1] else 0,
            "avg_commits_per_week": round(stats_row[2], 1) if stats_row[2] else 0
        }
        
        # Get skill assessments
        cursor.execute("""
            SELECT name, proficiency_level, created_at
            FROM user_skills 
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,))
        
        skills = []
        for row in cursor.fetchall():
            skills.append({
                "skill_name": row[0],
                "level": row[1],
                "assessed_at": row[2]
            })
        
        conn.close()
        
        return {
            "user": user_data,
            "manager": manager_data,
            "projects": projects,
            "activities": activities,
            "stats": stats,
            "skills": skills
        }
        
    except Exception as e:
        logger.error(f"Error fetching professional dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/projects/{user_id}")
async def get_professional_projects(user_id: str):
    """Get detailed projects for a professional"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify professional user
        cursor.execute("SELECT id FROM users WHERE id = ? AND role = 'professional'", (user_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Professional user not found")
        
        cursor.execute("""
            SELECT p.id, p.name, p.description, p.status, p.priority,
                   p.repository_url, p.created_at, p.updated_at,
                   pa.role as my_role, pa.assigned_at,
                   COUNT(DISTINCT pa2.professional_id) as team_count
            FROM project_assignments pa
            JOIN projects p ON pa.project_id = p.id
            LEFT JOIN project_assignments pa2 ON pa2.project_id = p.id AND pa2.is_active = 1
            WHERE pa.professional_id = ? AND pa.is_active = 1
            GROUP BY p.id, p.name, p.description, p.status, p.priority,
                     p.repository_url, p.created_at, p.updated_at,
                     pa.role, pa.assigned_at
        """, (user_id,))
        
        projects = []
        for row in cursor.fetchall():
            project_data = {
                "id": row[0],
                "name": row[1], 
                "description": row[2],
                "status": row[3],
                "priority": row[4],
                "repository_url": row[5],
                "created_at": row[6],
                "updated_at": row[7],
                "my_role": row[8],
                "joined_at": row[9],
                "team_count": row[10]
            }
            
            # Get team members for this project
            cursor.execute("""
                SELECT u.id, u.name, u.email, pa.role, pa.assigned_at
                FROM project_assignments pa
                JOIN users u ON pa.professional_id = u.id
                WHERE pa.project_id = ? AND pa.is_active = 1
            """, (project_data["id"],))
            
            team_members = []
            for member_row in cursor.fetchall():
                team_members.append({
                    "id": member_row[0],
                    "name": member_row[1],
                    "email": member_row[2],
                    "role": member_row[3],
                    "joined_at": member_row[4]
                })
            
            project_data["team_members"] = team_members
            projects.append(project_data)
        
        conn.close()
        return {"projects": projects}
        
    except Exception as e:
        logger.error(f"Error fetching professional projects: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/metrics/{user_id}")
async def get_professional_metrics(user_id: str, days: int = 30):
    """Get performance metrics for a professional"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get collaboration metrics over time
        cursor.execute("""
            SELECT week_ending as date, SUM(commits_count) as commits
            FROM collaboration_metrics 
            WHERE professional_id = ? 
            AND week_ending >= date('now', '-{} days')
            GROUP BY week_ending
            ORDER BY week_ending DESC
        """.format(days), (user_id,))
        
        commits_data = []
        for row in cursor.fetchall():
            commits_data.append({
                "date": row[0],
                "commits": row[1]
            })
        
        # Get metrics by project
        cursor.execute("""
            SELECT p.name, pm.metric_type, pm.metric_value, pm.recorded_at
            FROM project_metrics pm
            JOIN projects p ON pm.project_id = p.id
            JOIN project_assignments pa ON pa.project_id = p.id
            WHERE pa.professional_id = ? AND pa.is_active = 1
            AND pm.recorded_at >= datetime('now', '-{} days')
            ORDER BY pm.recorded_at DESC
        """.format(days), (user_id,))
        
        project_metrics = []
        for row in cursor.fetchall():
            project_metrics.append({
                "project_name": row[0],
                "metric_type": row[1],
                "value": row[2],
                "recorded_at": row[3]
            })
        
        conn.close()
        return {
            "commits_timeline": commits_data,
            "project_metrics": project_metrics
        }
        
    except Exception as e:
        logger.error(f"Error fetching professional metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/activity")
async def log_professional_activity(activity_data: dict):
    """Log a new activity for a professional"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO professional_activities 
            (professional_id, activity_type, project_id, description, created_at)
            VALUES (?, ?, ?, ?, datetime('now'))
        """, (
            activity_data["professional_id"],
            activity_data["activity_type"], 
            activity_data.get("project_id"),
            activity_data["description"]
        ))
        
        conn.commit()
        conn.close()
        
        return {"message": "Activity logged successfully"}
        
    except Exception as e:
        logger.error(f"Error logging activity: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

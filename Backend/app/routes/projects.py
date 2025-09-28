"""
Project management routes for creating and managing projects with team assignments
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import uuid
from datetime import datetime

router = APIRouter(prefix="/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    name: str
    description: str
    status: str = "planning"  # planning, active, completed, paused
    priority: str = "medium"  # low, medium, high
    repository_url: Optional[str] = None
    
class TeamMember(BaseModel):
    user_id: str
    role: str  # frontend, backend, fullstack, devops, designer, qa

class ProjectWithTeam(BaseModel):
    project: ProjectCreate
    team_members: List[TeamMember]

def get_db_connection():
    return sqlite3.connect('meridian.db')

class ProjectCreateWithManager(BaseModel):
    project: ProjectCreate
    team_members: List[TeamMember]
    manager_id: str

@router.post("/create")
async def create_project(project_data: ProjectCreateWithManager):
    """Create a new project and assign team members"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Generate project ID
        project_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        
        # Insert project
        cursor.execute("""
            INSERT INTO projects (id, name, description, status, priority, repository_url, manager_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            project_id,
            project_data.project.name,
            project_data.project.description,
            project_data.project.status,
            project_data.project.priority,
            project_data.project.repository_url,
            project_data.manager_id,
            created_at,
            created_at
        ))
        
        # Assign team members
        for member in project_data.team_members:
            assignment_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO project_assignments (id, project_id, professional_id, role, assigned_at)
                VALUES (?, ?, ?, ?, ?)
            """, (assignment_id, project_id, member.user_id, member.role, created_at))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "project_id": project_id,
            "message": f"Project '{project_data.project.name}' created successfully with {len(project_data.team_members)} team members"
        }
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

@router.get("/users/search")
async def search_users(role: str = None, query: str = ""):
    """Search for users by role and name/email"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = "SELECT id, name, email, role FROM users WHERE 1=1"
        params = []
        
        if role:
            sql += " AND role = ?"
            params.append(role)
            
        if query:
            sql += " AND (name LIKE ? OR email LIKE ?)"
            params.extend([f"%{query}%", f"%{query}%"])
        
        cursor.execute(sql, params)
        users = []
        
        for row in cursor.fetchall():
            users.append({
                "id": row[0],
                "name": row[1],
                "email": row[2],
                "role": row[3]
            })
        
        conn.close()
        return {"users": users}
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error searching users: {str(e)}")

@router.get("/manager/{manager_id}")
async def get_manager_projects(manager_id: str):
    """Get all projects managed by a specific manager"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get projects and their team counts
        cursor.execute("""
            SELECT p.*, COUNT(pa.professional_id) as team_count
            FROM projects p
            LEFT JOIN project_assignments pa ON p.id = pa.project_id AND pa.is_active = TRUE
            GROUP BY p.id
            ORDER BY p.created_at DESC
        """)
        
        projects = []
        for row in cursor.fetchall():
            projects.append({
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "status": row[3],
                "priority": row[4],
                "repository_url": row[5],
                "created_at": row[6],
                "updated_at": row[7],
                "team_count": row[8]
            })
        
        conn.close()
        return {"projects": projects}
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error fetching projects: {str(e)}")

@router.get("/{project_id}/team")
async def get_project_team(project_id: str):
    """Get team members for a specific project"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT u.id, u.name, u.email, u.role, pa.role as project_role, pa.assigned_at
            FROM users u
            JOIN project_assignments pa ON u.id = pa.professional_id
            WHERE pa.project_id = ? AND pa.is_active = TRUE
        """, (project_id,))
        
        team = []
        for row in cursor.fetchall():
            team.append({
                "id": row[0],
                "name": row[1],
                "email": row[2],
                "user_role": row[3],
                "project_role": row[4],
                "assigned_at": row[5]
            })
        
        conn.close()
        return {"team": team}
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error fetching team: {str(e)}")

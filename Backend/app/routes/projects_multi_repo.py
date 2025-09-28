"""
Enhanced project management routes with multi-repository support
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import uuid
from datetime import datetime

router = APIRouter(prefix="/projects", tags=["projects"])

class Repository(BaseModel):
    repository_name: str
    repository_url: str
    description: Optional[str] = None
    technology_stack: Optional[str] = None
    primary_language: Optional[str] = "JavaScript"
    branch: str = "main"
    is_primary: bool = False

class RepositoryAssignment(BaseModel):
    user_id: str
    repository_name: str  # Which repo they're assigned to
    role: str  # frontend, backend, fullstack, devops, designer, qa

class ProjectCreate(BaseModel):
    name: str
    description: str
    status: str = "planning"  # planning, active, completed, paused
    priority: str = "medium"  # low, medium, high
    repositories: List[Repository] = []  # Multiple repositories
    
class ProjectCreateWithManager(BaseModel):
    project: ProjectCreate
    repository_assignments: List[RepositoryAssignment]
    manager_id: str

class ProjectUpdateWithAssignments(BaseModel):
    project: ProjectCreate
    repository_assignments: List[RepositoryAssignment]

# Legacy support - keep old single repo structure for backward compatibility
class TeamMember(BaseModel):
    user_id: str
    role: str

class LegacyProjectCreate(BaseModel):
    name: str
    description: str
    status: str = "planning"
    priority: str = "medium" 
    repository_url: Optional[str] = None

class LegacyProjectWithManager(BaseModel):
    project: LegacyProjectCreate
    team_members: List[TeamMember]
    manager_id: str

def get_db_connection():
    return sqlite3.connect('meridian.db')

@router.post("/create")
async def create_project(project_data: ProjectCreateWithManager):
    """Create a new project with multiple repositories and assign team members"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Generate project ID
        project_id = str(uuid.uuid4())
        created_at = datetime.now().isoformat()
        
        # Insert project (keep repository_url for backward compatibility)
        primary_repo_url = None
        if project_data.project.repositories:
            primary_repo_url = next((r.repository_url for r in project_data.project.repositories if r.is_primary), 
                                   project_data.project.repositories[0].repository_url)
        
        cursor.execute("""
            INSERT INTO projects (id, name, description, status, priority, repository_url, manager_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            project_id,
            project_data.project.name,
            project_data.project.description,
            project_data.project.status,
            project_data.project.priority,
            primary_repo_url,
            project_data.manager_id,
            created_at,
            created_at
        ))
        
        # Insert repositories
        repo_id_map = {}  # Map repository names to IDs
        for repo in project_data.project.repositories:
            repo_id = str(uuid.uuid4())
            repo_id_map[repo.repository_name] = repo_id
            
            cursor.execute("""
                INSERT INTO project_repositories 
                (id, project_id, repository_url, repository_name, description, technology_stack, primary_language, branch, is_primary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                repo_id, project_id, repo.repository_url, repo.repository_name,
                repo.description, repo.technology_stack, repo.primary_language,
                repo.branch, repo.is_primary
            ))
        
        # Insert repository assignments
        for assignment in project_data.repository_assignments:
            if assignment.repository_name not in repo_id_map:
                raise HTTPException(status_code=400, detail=f"Repository '{assignment.repository_name}' not found in project repositories")
            
            assignment_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO repository_assignments (id, project_id, repository_id, professional_id, role)
                VALUES (?, ?, ?, ?, ?)
            """, (assignment_id, project_id, repo_id_map[assignment.repository_name], assignment.user_id, assignment.role))
        
        # Also maintain project_assignments for backward compatibility
        user_roles = {}
        for assignment in project_data.repository_assignments:
            if assignment.user_id not in user_roles:
                user_roles[assignment.user_id] = assignment.role
        
        for user_id, role in user_roles.items():
            assignment_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO project_assignments (id, project_id, professional_id, role, assigned_at)
                VALUES (?, ?, ?, ?, ?)
            """, (assignment_id, project_id, user_id, role, created_at))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "project_id": project_id,
            "message": f"Project '{project_data.project.name}' created successfully with {len(project_data.project.repositories)} repositories and {len(user_roles)} team members"
        }
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

@router.post("/create-simple")
async def create_simple_project(project_data: LegacyProjectWithManager):
    """Create a project with single repository (legacy support)"""
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
        
        # If repository_url provided, create a repository record
        if project_data.project.repository_url:
            repo_id = str(uuid.uuid4())
            repo_name = project_data.project.repository_url.split('/')[-1].replace('.git', '') or f"{project_data.project.name}-main"
            
            cursor.execute("""
                INSERT INTO project_repositories 
                (id, project_id, repository_url, repository_name, description, is_primary)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (repo_id, project_id, project_data.project.repository_url, repo_name, f"Main repository for {project_data.project.name}", True))
            
            # Assign team members to the repository
            for member in project_data.team_members:
                assignment_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO repository_assignments (id, project_id, repository_id, professional_id, role)
                    VALUES (?, ?, ?, ?, ?)
                """, (assignment_id, project_id, repo_id, member.user_id, member.role))
        
        # Assign team members to project
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

@router.get("/{project_id}/repositories")
async def get_project_repositories(project_id: str):
    """Get repositories for a specific project"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get project repositories
        cursor.execute("""
            SELECT pr.id, pr.repository_url, pr.repository_name, pr.description,
                   pr.technology_stack, pr.primary_language, pr.branch, pr.is_primary,
                   p.name as project_name, p.description as project_description
            FROM project_repositories pr
            JOIN projects p ON pr.project_id = p.id
            WHERE pr.project_id = ?
        """, (project_id,))
        
        repositories = []
        project_info = None
        
        for row in cursor.fetchall():
            if not project_info:
                project_info = {
                    "name": row[8],
                    "description": row[9]
                }
            
            repositories.append({
                "id": row[0],
                "repository_url": row[1],
                "repository_name": row[2],
                "description": row[3],
                "technology_stack": row[4],
                "primary_language": row[5],
                "branch": row[6],
                "is_primary": bool(row[7])
            })
        
        conn.close()
        return {
            "project": {
                "id": project_id,
                **project_info,
                "repositories": repositories
            }
        }
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error fetching project repositories: {str(e)}")

@router.get("/multi-repo/{project_id}")
async def get_multi_repo_project(project_id: str):
    """Get complete multi-repo project details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get project details
        cursor.execute("SELECT name, description, manager_id FROM projects WHERE id = ?", (project_id,))
        project_row = cursor.fetchone()
        
        if not project_row:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get project repositories
        cursor.execute("""
            SELECT id, repository_url, repository_name, description,
                   technology_stack, primary_language, branch, is_primary
            FROM project_repositories
            WHERE project_id = ?
        """, (project_id,))
        
        repositories = []
        for row in cursor.fetchall():
            repositories.append({
                "id": row[0],
                "repository_url": row[1],
                "repository_name": row[2],
                "description": row[3],
                "technology_stack": row[4],
                "primary_language": row[5],
                "branch": row[6],
                "is_primary": bool(row[7])
            })
        
        conn.close()
        return {
            "project": {
                "id": project_id,
                "name": project_row[0],
                "description": project_row[1],
                "manager_id": project_row[2],
                "repositories": repositories
            }
        }
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error fetching project: {str(e)}")

@router.get("/{project_id}/assignments")
async def get_project_assignments(project_id: str):
    """Get repository assignments for a project"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get repository assignments with user details
        cursor.execute("""
            SELECT ra.id, ra.professional_id as user_id, ra.role, pr.repository_name,
                   u.name, u.email, u.role as user_role
            FROM repository_assignments ra
            JOIN project_repositories pr ON ra.repository_id = pr.id
            JOIN users u ON ra.professional_id = u.id
            WHERE ra.project_id = ?
        """, (project_id,))
        
        assignments = []
        for row in cursor.fetchall():
            assignments.append({
                "id": row[0],
                "user_id": row[1],
                "role": row[2],
                "repository_name": row[3],
                "user": {
                    "id": row[1],
                    "name": row[4],
                    "email": row[5],
                    "role": row[6]
                }
            })
        
        conn.close()
        return {"assignments": assignments}
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error fetching assignments: {str(e)}")

@router.put("/multi-repo/{project_id}")
async def update_multi_repo_project(project_id: str, project_data: ProjectUpdateWithAssignments):
    """Update a multi-repo project"""
    try:
        print(f"Updating project {project_id}")
        print(f"Project data: {project_data}")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify project exists and user is manager
        cursor.execute("SELECT manager_id FROM projects WHERE id = ?", (project_id,))
        project_row = cursor.fetchone()
        
        if not project_row:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update project basic info
        cursor.execute("""
            UPDATE projects 
            SET name = ?, description = ?
            WHERE id = ?
        """, (project_data.project.name, project_data.project.description, project_id))
        
        # Delete existing repositories and assignments
        cursor.execute("DELETE FROM repository_assignments WHERE project_id = ?", (project_id,))
        cursor.execute("DELETE FROM project_repositories WHERE project_id = ?", (project_id,))
        
        # Insert updated repositories
        repo_id_map = {}
        for repo in project_data.project.repositories:
            repo_id = str(uuid.uuid4())
            repo_id_map[repo.repository_name] = repo_id
            
            cursor.execute("""
                INSERT INTO project_repositories 
                (id, project_id, repository_url, repository_name, description, 
                 technology_stack, primary_language, branch, is_primary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                repo_id, project_id, repo.repository_url, repo.repository_name,
                repo.description, repo.technology_stack, repo.primary_language,
                repo.branch, repo.is_primary
            ))
        
        # Insert updated repository assignments
        for assignment in project_data.repository_assignments:
            if assignment.repository_name not in repo_id_map:
                continue
            
            assignment_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO repository_assignments (id, project_id, repository_id, professional_id, role)
                VALUES (?, ?, ?, ?, ?)
            """, (assignment_id, project_id, repo_id_map[assignment.repository_name], assignment.user_id, assignment.role))
        
        # Update project_assignments for backward compatibility
        cursor.execute("DELETE FROM project_assignments WHERE project_id = ?", (project_id,))
        
        user_roles = {}
        for assignment in project_data.repository_assignments:
            if assignment.user_id not in user_roles:
                user_roles[assignment.user_id] = assignment.role
        
        for user_id, role in user_roles.items():
            assignment_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO project_assignments (id, project_id, professional_id, role, assigned_at)
                VALUES (?, ?, ?, ?, ?)
            """, (assignment_id, project_id, user_id, role, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return {
            "success": True,
            "project_id": project_id,
            "message": f"Project '{project_data.project.name}' updated successfully"
        }
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error updating project: {str(e)}")

@router.delete("/multi-repo/{project_id}")
async def delete_project(project_id: str):
    """Delete a project and all its associations"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Delete in correct order due to foreign key constraints
        cursor.execute("DELETE FROM repository_assignments WHERE project_id = ?", (project_id,))
        cursor.execute("DELETE FROM project_assignments WHERE project_id = ?", (project_id,))
        cursor.execute("DELETE FROM project_repositories WHERE project_id = ?", (project_id,))
        cursor.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        
        conn.commit()
        conn.close()
        
        return {"success": True, "message": "Project deleted successfully"}
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error deleting project: {str(e)}")

@router.get("/manager/{manager_id}")
async def get_manager_projects(manager_id: str):
    """Get all projects for a specific manager"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get all projects for this manager
        cursor.execute("""
            SELECT id, name, description, status, priority, repository_url, created_at
            FROM projects 
            WHERE manager_id = ?
            ORDER BY created_at DESC
        """, (manager_id,))
        
        projects = []
        for row in cursor.fetchall():
            projects.append({
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "status": row[3] or "active",
                "priority": row[4] or "medium", 
                "repository_url": row[5],
                "created_at": row[6]
            })
        
        conn.close()
        return {"projects": projects}
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error fetching manager projects: {str(e)}")
async def get_project_repositories(project_id: str):
    """Get all repositories for a project with their assignments"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get repositories
        cursor.execute("""
            SELECT id, repository_name, repository_url, description, technology_stack, 
                   primary_language, branch, is_primary, added_at
            FROM project_repositories
            WHERE project_id = ? AND is_active = TRUE
            ORDER BY is_primary DESC, repository_name
        """, (project_id,))
        
        repositories = []
        for row in cursor.fetchall():
            repo_id = row[0]
            
            # Get assignments for this repository
            cursor.execute("""
                SELECT u.id, u.name, u.email, ra.role
                FROM repository_assignments ra
                JOIN users u ON ra.professional_id = u.id
                WHERE ra.repository_id = ? AND ra.is_active = TRUE
            """, (repo_id,))
            
            assignments = []
            for user_row in cursor.fetchall():
                assignments.append({
                    "user_id": user_row[0],
                    "name": user_row[1],
                    "email": user_row[2],
                    "role": user_row[3]
                })
            
            repositories.append({
                "id": repo_id,
                "repository_name": row[1],
                "repository_url": row[2],
                "description": row[3],
                "technology_stack": row[4],
                "primary_language": row[5],
                "branch": row[6],
                "is_primary": row[7],
                "added_at": row[8],
                "assignments": assignments
            })
        
        conn.close()
        return {"repositories": repositories}
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error fetching repositories: {str(e)}")

@router.get("/manager/{manager_id}")
async def get_manager_projects(manager_id: str):
    """Get all projects managed by a specific manager with repository info"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get projects and their team counts
        cursor.execute("""
            SELECT p.*, COUNT(DISTINCT pa.professional_id) as team_count
            FROM projects p
            LEFT JOIN project_assignments pa ON p.id = pa.project_id AND pa.is_active = TRUE
            GROUP BY p.id
            ORDER BY p.created_at DESC
        """)
        
        projects = []
        for row in cursor.fetchall():
            project_id = row[0]
            
            # Get repository count for this project
            cursor.execute("""
                SELECT COUNT(*) FROM project_repositories 
                WHERE project_id = ? AND is_active = TRUE
            """, (project_id,))
            repo_count = cursor.fetchone()[0]
            
            projects.append({
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "status": row[3],
                "priority": row[4],
                "repository_url": row[5],
                "manager_id": row[6],
                "created_at": row[7],
                "updated_at": row[8],
                "team_count": row[9],
                "repository_count": repo_count
            })
        
        conn.close()
        return {"projects": projects}
        
    except Exception as e:
        if conn:
            conn.close()
        raise HTTPException(status_code=500, detail=f"Error fetching projects: {str(e)}")

"""
Manager-specific routes for project and team management
"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import sqlite3
import uuid
from datetime import datetime, timedelta
import json

router = APIRouter(prefix="/manager", tags=["manager"])

DB_PATH = "meridian.db"

def get_db_connection():
    """Get database connection"""
    return sqlite3.connect(DB_PATH)

@router.get("/dashboard/{manager_id}")
async def get_manager_dashboard(manager_id: str):
    """Get complete manager dashboard data"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get manager info
        cursor.execute("SELECT name, email, role FROM users WHERE id = ?", (manager_id,))
        manager = cursor.fetchone()
        if not manager or manager[2] != 'manager':
            raise HTTPException(status_code=403, detail="Access denied. Manager role required.")
        
        # Get projects managed by this manager
        cursor.execute('''
        SELECT id, name, description, status, priority, repository_url, 
               created_at, start_date, end_date
        FROM projects WHERE manager_id = ?
        ORDER BY created_at DESC
        ''', (manager_id,))
        projects = cursor.fetchall()
        
        # Get team members count for each project
        project_data = []
        for project in projects:
            project_id = project[0]
            
            # Get team members
            cursor.execute('''
            SELECT u.id, u.name, u.email, u.role, tm.role as project_role, tm.joined_at
            FROM team_members tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.project_id = ? AND tm.status = 'active'
            ''', (project_id,))
            team_members = cursor.fetchall()
            
            # Get latest metrics
            cursor.execute('''
            SELECT metric_type, metric_value, recorded_at
            FROM project_metrics 
            WHERE project_id = ?
            ORDER BY recorded_at DESC
            LIMIT 10
            ''', (project_id,))
            metrics = cursor.fetchall()
            
            project_data.append({
                "id": project[0],
                "name": project[1],
                "description": project[2],
                "status": project[3],
                "priority": project[4],
                "repository_url": project[5],
                "created_at": project[6],
                "start_date": project[7],
                "end_date": project[8],
                "team_members": [
                    {
                        "id": member[0],
                        "name": member[1],
                        "email": member[2],
                        "user_role": member[3],
                        "project_role": member[4],
                        "joined_at": member[5]
                    } for member in team_members
                ],
                "metrics": {
                    metric[0]: {
                        "value": metric[1],
                        "recorded_at": metric[2]
                    } for metric in metrics
                },
                "team_count": len(team_members)
            })
        
        # Get overall team stats
        cursor.execute('''
        SELECT COUNT(DISTINCT tm.user_id) as total_team_members,
               COUNT(DISTINCT p.id) as total_projects,
               AVG(pm.metric_value) as avg_velocity
        FROM projects p
        LEFT JOIN team_members tm ON p.id = tm.project_id
        LEFT JOIN project_metrics pm ON p.id = pm.project_id AND pm.metric_type = 'velocity'
        WHERE p.manager_id = ?
        ''', (manager_id,))
        stats = cursor.fetchone()
        
        conn.close()
        
        return {
            "manager": {
                "name": manager[0],
                "email": manager[1],
                "role": manager[2]
            },
            "projects": project_data,
            "stats": {
                "total_team_members": stats[0] or 0,
                "total_projects": stats[1] or 0,
                "avg_velocity": round(stats[2] or 0, 1)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/{manager_id}")
async def get_manager_projects(manager_id: str):
    """Get all projects for a manager"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT p.id, p.name, p.description, p.status, p.priority, p.repository_url,
               COUNT(tm.user_id) as team_count,
               AVG(CASE WHEN pm.metric_type = 'velocity' THEN pm.metric_value END) as velocity,
               AVG(CASE WHEN pm.metric_type = 'code_quality' THEN pm.metric_value END) as quality
        FROM projects p
        LEFT JOIN team_members tm ON p.id = tm.project_id AND tm.status = 'active'
        LEFT JOIN project_metrics pm ON p.id = pm.project_id
        WHERE p.manager_id = ?
        GROUP BY p.id, p.name, p.description, p.status, p.priority, p.repository_url
        ORDER BY p.created_at DESC
        ''', (manager_id,))
        
        projects = cursor.fetchall()
        conn.close()
        
        return {
            "projects": [
                {
                    "id": project[0],
                    "name": project[1],
                    "description": project[2],
                    "status": project[3],
                    "priority": project[4],
                    "repository_url": project[5],
                    "team_count": project[6] or 0,
                    "velocity": round(project[7] or 0, 1),
                    "quality": round(project[8] or 0, 1)
                } for project in projects
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/team/{manager_id}")
async def get_team_overview(manager_id: str):
    """Get team overview across all projects"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT DISTINCT u.id, u.name, u.email, u.role, u.github_username,
               COUNT(tm.project_id) as project_count,
               GROUP_CONCAT(p.name, ', ') as projects
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        JOIN projects p ON tm.project_id = p.id
        WHERE p.manager_id = ? AND tm.status = 'active'
        GROUP BY u.id, u.name, u.email, u.role, u.github_username
        ORDER BY u.name
        ''', (manager_id,))
        
        team_members = cursor.fetchall()
        conn.close()
        
        return {
            "team_members": [
                {
                    "id": member[0],
                    "name": member[1],
                    "email": member[2],
                    "role": member[3],
                    "github_username": member[4],
                    "project_count": member[5],
                    "projects": member[6].split(', ') if member[6] else []
                } for member in team_members
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/projects/{manager_id}")
async def create_project(manager_id: str, project_data: Dict[str, Any]):
    """Create a new project"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify manager role
        cursor.execute("SELECT role FROM users WHERE id = ?", (manager_id,))
        user_role = cursor.fetchone()
        if not user_role or user_role[0] != 'manager':
            raise HTTPException(status_code=403, detail="Access denied. Manager role required.")
        
        project_id = str(uuid.uuid4())
        
        cursor.execute('''
        INSERT INTO projects (id, name, description, status, manager_id, priority, repository_url, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            project_id,
            project_data.get('name'),
            project_data.get('description', ''),
            project_data.get('status', 'planning'),
            manager_id,
            project_data.get('priority', 'medium'),
            project_data.get('repository_url', ''),
            project_data.get('start_date'),
            project_data.get('end_date')
        ))
        
        conn.commit()
        conn.close()
        
        return {"message": "Project created successfully", "project_id": project_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/{manager_id}")
async def get_manager_analytics(manager_id: str):
    """Get analytics data for manager dashboard charts"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get metrics over time for charts
        cursor.execute('''
        SELECT pm.metric_type, pm.metric_value, pm.recorded_at, p.name
        FROM project_metrics pm
        JOIN projects p ON pm.project_id = p.id
        WHERE p.manager_id = ?
        AND pm.recorded_at >= date('now', '-30 days')
        ORDER BY pm.recorded_at DESC
        ''', (manager_id,))
        
        metrics = cursor.fetchall()
        
        # Group metrics by type for charts
        chart_data = {}
        for metric in metrics:
            metric_type = metric[0]
            if metric_type not in chart_data:
                chart_data[metric_type] = []
            chart_data[metric_type].append({
                "value": metric[1],
                "date": metric[2],
                "project": metric[3]
            })
        
        # Get team productivity stats
        cursor.execute('''
        SELECT 
            COUNT(DISTINCT tm.user_id) as active_developers,
            COUNT(DISTINCT p.id) as active_projects,
            AVG(CASE WHEN pm.metric_type = 'velocity' THEN pm.metric_value END) as avg_velocity,
            AVG(CASE WHEN pm.metric_type = 'code_quality' THEN pm.metric_value END) as avg_quality,
            AVG(CASE WHEN pm.metric_type = 'team_satisfaction' THEN pm.metric_value END) as avg_satisfaction
        FROM projects p
        LEFT JOIN team_members tm ON p.id = tm.project_id AND tm.status = 'active'
        LEFT JOIN project_metrics pm ON p.id = pm.project_id
        WHERE p.manager_id = ? AND p.status = 'active'
        ''', (manager_id,))
        
        team_stats = cursor.fetchone()
        
        conn.close()
        
        return {
            "chart_data": chart_data,
            "team_stats": {
                "active_developers": team_stats[0] or 0,
                "active_projects": team_stats[1] or 0,
                "avg_velocity": round(team_stats[2] or 0, 1),
                "avg_quality": round(team_stats[3] or 0, 1),
                "avg_satisfaction": round(team_stats[4] or 0, 1)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

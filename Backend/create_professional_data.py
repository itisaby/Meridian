#!/usr/bin/env python3
"""
Create sample data for Professional Dashboard testing
"""
import sqlite3
import uuid
from datetime import datetime, timedelta
import random

def create_sample_professional_data():
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    
    print("🔧 Creating sample professional dashboard data...")
    
    # Create a professional user if it doesn't exist
    professional_id = "9c8c03dc-0abe-4448-87ef-ca19cda5caf7"  # Existing professional user
    manager_id = "f1f8a61b-13e9-49e7-a33c-cbff9fae8ff5"  # Existing manager user
    
    # Check if professional-manager mapping exists
    cursor.execute("SELECT * FROM professional_managers WHERE professional_id = ?", (professional_id,))
    if not cursor.fetchone():
        cursor.execute("""
            INSERT INTO professional_managers (id, professional_id, manager_id, assigned_at)
            VALUES (?, ?, ?, ?)
        """, (str(uuid.uuid4()), professional_id, manager_id, datetime.now().isoformat()))
        print(f"✅ Created professional-manager mapping")
    
    # Create sample projects and assign professional to them
    projects_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "React Dashboard",
            "description": "Modern React-based admin dashboard with real-time analytics",
            "status": "active",
            "priority": "high",
            "repository_url": "https://github.com/meridian/react-dashboard"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "API Gateway Service", 
            "description": "Microservices API gateway with authentication and rate limiting",
            "status": "active",
            "priority": "medium",
            "repository_url": "https://github.com/meridian/api-gateway"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Mobile App Integration",
            "description": "Integration layer for mobile applications",
            "status": "planning",
            "priority": "low", 
            "repository_url": "https://github.com/meridian/mobile-integration"
        }
    ]
    
    project_roles = ["frontend", "backend", "fullstack"]
    
    for i, project in enumerate(projects_data):
        # Insert project if it doesn't exist
        cursor.execute("SELECT id FROM projects WHERE name = ?", (project["name"],))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO projects (id, name, description, status, priority, repository_url, manager_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                project["id"], project["name"], project["description"],
                project["status"], project["priority"], project["repository_url"], manager_id,
                datetime.now().isoformat(), datetime.now().isoformat()
            ))
            print(f"✅ Created project: {project['name']}")
        else:
            # Get existing project ID
            cursor.execute("SELECT id FROM projects WHERE name = ?", (project["name"],))
            project["id"] = cursor.fetchone()[0]
        
        # Add professional as project member
        cursor.execute("SELECT * FROM project_assignments WHERE professional_id = ? AND project_id = ?", 
                      (professional_id, project["id"]))
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO project_assignments (id, professional_id, project_id, role, assigned_at)
                VALUES (?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), professional_id, project["id"], project_roles[i % len(project_roles)], 
                 (datetime.now() - timedelta(days=random.randint(30, 120))).isoformat()))
            print(f"✅ Added professional to project: {project['name']}")
    
    # Create sample commits data for the last 30 days (stored in collaboration_metrics)
    cursor.execute("DELETE FROM collaboration_metrics WHERE professional_id = ?", (professional_id,))
    
    cursor.execute("SELECT id FROM projects")
    existing_projects = cursor.fetchall()
    
    for project_row in existing_projects:
        # Create collaboration metrics for each project
        commits_count = random.randint(15, 45)  # commits in last 30 days
        pull_requests = random.randint(3, 12)
        code_reviews = random.randint(5, 20)
        issues_resolved = random.randint(2, 10)
        
        # Create entry for current week
        week_ending = datetime.now().date().isoformat()
        
        cursor.execute("""
            INSERT INTO collaboration_metrics (
                id, professional_id, project_id, commits_count, 
                pull_requests_count, code_reviews_count, issues_resolved, 
                last_activity, week_ending
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()), professional_id, project_row[0],
            commits_count, pull_requests, code_reviews, issues_resolved,
            datetime.now().isoformat(), week_ending
        ))
    
    print(f"✅ Created collaboration metrics for professional")
    
    # Create sample metrics (stored in project_metrics table)
    cursor.execute("DELETE FROM project_metrics WHERE project_id IN (SELECT id FROM projects)")
    
    cursor.execute("SELECT id FROM projects")
    all_projects = cursor.fetchall()
    
    for project_row in all_projects:
        # Create different types of metrics for the project
        metrics_data = [
            {"type": "code_quality", "value": random.randint(75, 95)},
            {"type": "test_coverage", "value": random.randint(60, 90)},
            {"type": "performance_score", "value": random.randint(70, 95)},
            {"type": "security_score", "value": random.randint(80, 100)}
        ]
        
        for metric in metrics_data:
            cursor.execute("""
                INSERT INTO project_metrics (
                    id, project_id, metric_type, metric_value, recorded_at
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                str(uuid.uuid4()), project_row[0], metric["type"],
                metric["value"], datetime.now().isoformat()
            ))
    
    print(f"✅ Created project metrics")
    
    # Create sample skills (stored in user_skills table)
    cursor.execute("DELETE FROM user_skills WHERE user_id = ?", (professional_id,))
    
    skills_data = [
        {"name": "React", "level": 4, "category": "Frontend"},
        {"name": "Node.js", "level": 3, "category": "Backend"},
        {"name": "Python", "level": 5, "category": "Backend"},
        {"name": "PostgreSQL", "level": 3, "category": "Database"},
        {"name": "Docker", "level": 2, "category": "DevOps"},
        {"name": "AWS", "level": 3, "category": "Cloud"},
        {"name": "TypeScript", "level": 4, "category": "Frontend"},
        {"name": "Jest Testing", "level": 3, "category": "Testing"}
    ]
    
    for skill in skills_data:
        cursor.execute("""
            INSERT INTO user_skills (user_id, name, category, proficiency_level, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (
            professional_id, skill["name"], skill["category"],
            skill["level"], datetime.now().isoformat()
        ))
    
    print(f"✅ Created skills profile")
    
    # Create sample activities
    cursor.execute("DELETE FROM professional_activities WHERE professional_id = ?", (professional_id,))
    
    activities = [
        {"type": "code_commit", "desc": "Implemented user authentication module"},
        {"type": "code_review", "desc": "Reviewed pull request #234 - API endpoints"},
        {"type": "bug_fix", "desc": "Fixed critical bug in payment processing"},
        {"type": "feature_complete", "desc": "Completed dashboard analytics feature"},
        {"type": "testing", "desc": "Added unit tests for user service"},
        {"type": "deployment", "desc": "Deployed hotfix to production"},
        {"type": "meeting", "desc": "Attended sprint planning meeting"},
        {"type": "documentation", "desc": "Updated API documentation"},
        {"type": "code_refactor", "desc": "Refactored database query optimization"},
        {"type": "performance", "desc": "Improved page load time by 40%"}
    ]
    
    cursor.execute("SELECT id FROM projects")
    project_ids = [row[0] for row in cursor.fetchall()]
    
    for i, activity in enumerate(activities):
        activity_date = datetime.now() - timedelta(hours=random.randint(1, 720))  # Last 30 days
        cursor.execute("""
            INSERT INTO professional_activities (
                id, professional_id, activity_type, project_id, description, created_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()), professional_id, activity["type"],
            random.choice(project_ids), activity["desc"], activity_date.isoformat()
        ))
    
    print(f"✅ Created activity timeline")
    
    conn.commit()
    conn.close()
    
    print("🎉 Sample professional dashboard data created successfully!")
    print(f"Professional User ID: {professional_id}")
    print(f"Manager User ID: {manager_id}")
    print("You can now test the professional dashboard endpoints.")

if __name__ == "__main__":
    create_sample_professional_data()

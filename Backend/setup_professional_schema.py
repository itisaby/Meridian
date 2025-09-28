#!/usr/bin/env python3
"""
Professional Dashboard Database Schema Setup
Creates tables for professional-manager relationships, project assignments, and repositories
"""

import sqlite3
import uuid
from datetime import datetime

def setup_professional_dashboard_schema():
    """Set up database schema for professional dashboard"""
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    
    # Manager-Professional relationship table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS professional_managers (
            id TEXT PRIMARY KEY,
            professional_id TEXT NOT NULL,
            manager_id TEXT NOT NULL,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (professional_id) REFERENCES users (id),
            FOREIGN KEY (manager_id) REFERENCES users (id),
            UNIQUE(professional_id)
        )
    ''')
    
    # Projects table (enhanced from manager dashboard)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'planning',
            priority TEXT DEFAULT 'medium',
            repository_url TEXT,
            manager_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (manager_id) REFERENCES users (id)
        )
    ''')
    
    # Professional-Project assignment table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS project_assignments (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            professional_id TEXT NOT NULL,
            role TEXT NOT NULL,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (project_id) REFERENCES projects (id),
            FOREIGN KEY (professional_id) REFERENCES users (id),
            UNIQUE(project_id, professional_id)
        )
    ''')
    
    # Project repositories table (many-to-many: projects can have multiple repos)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS project_repositories (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            repository_url TEXT NOT NULL,
            repository_name TEXT NOT NULL,
            branch TEXT DEFAULT 'main',
            is_primary BOOLEAN DEFAULT FALSE,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id),
            UNIQUE(project_id, repository_url)
        )
    ''')
    
    # Professional activity log
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS professional_activities (
            id TEXT PRIMARY KEY,
            professional_id TEXT NOT NULL,
            project_id TEXT,
            activity_type TEXT NOT NULL,
            description TEXT,
            metadata TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (professional_id) REFERENCES users (id),
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )
    ''')
    
    # Team collaboration metrics
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS collaboration_metrics (
            id TEXT PRIMARY KEY,
            professional_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            commits_count INTEGER DEFAULT 0,
            pull_requests_count INTEGER DEFAULT 0,
            code_reviews_count INTEGER DEFAULT 0,
            issues_resolved INTEGER DEFAULT 0,
            last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            week_ending DATE NOT NULL,
            FOREIGN KEY (professional_id) REFERENCES users (id),
            FOREIGN KEY (project_id) REFERENCES projects (id),
            UNIQUE(professional_id, project_id, week_ending)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Professional dashboard schema created successfully!")

def create_sample_data():
    """Create sample data for professional dashboard testing"""
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    
    # Check if we already have the manager user
    cursor.execute("SELECT id FROM users WHERE role = 'manager' LIMIT 1")
    manager = cursor.fetchone()
    
    if not manager:
        print("❌ No manager user found. Please run create_manager_user.py first.")
        conn.close()
        return
        
    manager_id = manager[0]
    
    # Create professional user
    professional_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT OR IGNORE INTO users (id, name, email, role, skills)
        VALUES (?, ?, ?, ?, ?)
    """, (professional_id, "Sarah Johnson", "sarah.johnson@meridian.dev", "professional", 
          "React,Node.js,TypeScript,Python,AWS"))
    
    # Create professional-manager relationship
    cursor.execute("""
        INSERT OR IGNORE INTO professional_managers (id, professional_id, manager_id)
        VALUES (?, ?, ?)
    """, (str(uuid.uuid4()), professional_id, manager_id))
    
    # Create projects
    project1_id = str(uuid.uuid4())
    project2_id = str(uuid.uuid4())
    
    projects = [
        (project1_id, "E-commerce Platform", "Modern React-based e-commerce solution with microservices architecture", "active", "high", "https://github.com/meridian/ecommerce", manager_id),
        (project2_id, "Analytics Dashboard", "Real-time analytics dashboard for business intelligence", "active", "medium", "https://github.com/meridian/analytics-dashboard", manager_id)
    ]
    
    cursor.executemany("""
        INSERT OR IGNORE INTO projects (id, name, description, status, priority, repository_url, manager_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, projects)
    
    # Assign professional to projects
    assignments = [
        (str(uuid.uuid4()), project1_id, professional_id, "frontend_developer"),
        (str(uuid.uuid4()), project2_id, professional_id, "full_stack_developer")
    ]
    
    cursor.executemany("""
        INSERT OR IGNORE INTO project_assignments (id, project_id, professional_id, role)
        VALUES (?, ?, ?, ?)
    """, assignments)
    
    # Add project repositories
    repositories = [
        (str(uuid.uuid4()), project1_id, "https://github.com/meridian/ecommerce-frontend", "ecommerce-frontend", "main", True),
        (str(uuid.uuid4()), project1_id, "https://github.com/meridian/ecommerce-api", "ecommerce-api", "develop", False),
        (str(uuid.uuid4()), project2_id, "https://github.com/meridian/analytics-dashboard", "analytics-dashboard", "main", True),
        (str(uuid.uuid4()), project2_id, "https://github.com/meridian/analytics-api", "analytics-api", "main", False)
    ]
    
    cursor.executemany("""
        INSERT OR IGNORE INTO project_repositories (id, project_id, repository_url, repository_name, branch, is_primary)
        VALUES (?, ?, ?, ?, ?, ?)
    """, repositories)
    
    # Add collaboration metrics
    from datetime import date, timedelta
    today = date.today()
    last_week = today - timedelta(days=7)
    
    metrics = [
        (str(uuid.uuid4()), professional_id, project1_id, 15, 3, 8, 5, last_week),
        (str(uuid.uuid4()), professional_id, project2_id, 12, 2, 5, 3, last_week),
        (str(uuid.uuid4()), professional_id, project1_id, 18, 4, 10, 7, today),
        (str(uuid.uuid4()), professional_id, project2_id, 10, 1, 6, 2, today)
    ]
    
    cursor.executemany("""
        INSERT OR IGNORE INTO collaboration_metrics 
        (id, professional_id, project_id, commits_count, pull_requests_count, code_reviews_count, issues_resolved, week_ending)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, metrics)
    
    # Add some activity logs
    activities = [
        (str(uuid.uuid4()), professional_id, project1_id, "commit", "Implemented user authentication flow", '{"commits": 3, "files_changed": 8}'),
        (str(uuid.uuid4()), professional_id, project1_id, "pull_request", "Added payment integration", '{"pr_number": 42, "lines_added": 250}'),
        (str(uuid.uuid4()), professional_id, project2_id, "code_review", "Reviewed data visualization component", '{"review_id": 15, "comments": 3}'),
        (str(uuid.uuid4()), professional_id, project2_id, "issue_resolved", "Fixed dashboard loading performance", '{"issue_number": 23, "time_spent": "4h"}')
    ]
    
    cursor.executemany("""
        INSERT OR IGNORE INTO professional_activities (id, professional_id, project_id, activity_type, description, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
    """, activities)
    
    conn.commit()
    conn.close()
    
    print("✅ Sample professional dashboard data created successfully!")
    print(f"📝 Professional User ID: {professional_id}")
    print(f"📝 Professional Email: sarah.johnson@meridian.dev")
    print(f"📝 Manager ID: {manager_id}")

if __name__ == "__main__":
    setup_professional_dashboard_schema()
    create_sample_data()

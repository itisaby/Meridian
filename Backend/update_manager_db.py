"""
Database schema update for Manager features - Projects and Team Management
"""

import sqlite3
import uuid
from datetime import datetime

def update_database_for_managers():
    """Add tables for project and team management"""
    
    conn = sqlite3.connect('/Users/arnabmaity/Documents/Meridian/Backend/meridian.db')
    cursor = conn.cursor()
    
    # Create projects table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        manager_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        start_date DATE,
        end_date DATE,
        priority TEXT DEFAULT 'medium',
        repository_url TEXT,
        FOREIGN KEY (manager_id) REFERENCES users (id)
    )
    ''')
    
    # Create team_members table (links users to projects)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'developer',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(project_id, user_id)
    )
    ''')
    
    # Create project_metrics table for tracking project health
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS project_metrics (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        metric_type TEXT NOT NULL,
        metric_value REAL NOT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT,
        FOREIGN KEY (project_id) REFERENCES projects (id)
    )
    ''')
    
    # Create team_insights table for storing MCP-generated insights
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS team_insights (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        insight_type TEXT NOT NULL,
        insight_data TEXT NOT NULL,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id)
    )
    ''')
    
    print("✅ Database tables created successfully!")
    
    # Insert sample data for demonstration
    insert_sample_data(cursor)
    
    conn.commit()
    conn.close()
    
def insert_sample_data(cursor):
    """Insert sample projects and team data"""
    
    # Get the manager user ID
    manager_id = 'f1f8a61b-13e9-49e7-a33c-cbff9fae8ff5'  # Our test manager
    professional_id = '9c8c03dc-0abe-4448-87ef-ca19cda5caf7'  # Our test professional
    student_id = '3d8ffc7c-4045-4a06-b97c-5cc01ca69538'  # Our test student
    
    # Create sample projects
    projects = [
        {
            'id': str(uuid.uuid4()),
            'name': 'Meridian Platform Enhancement',
            'description': 'Enhancing the core Meridian platform with new AI features',
            'status': 'active',
            'manager_id': manager_id,
            'priority': 'high',
            'repository_url': 'https://github.com/itisaby/Meridian'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Customer Analytics Dashboard',
            'description': 'Building customer insights and analytics dashboard',
            'status': 'active', 
            'manager_id': manager_id,
            'priority': 'medium',
            'repository_url': 'https://github.com/company/analytics-dashboard'
        },
        {
            'id': str(uuid.uuid4()),
            'name': 'Mobile App Development',
            'description': 'React Native mobile application for Meridian',
            'status': 'planning',
            'manager_id': manager_id,
            'priority': 'low',
            'repository_url': 'https://github.com/company/meridian-mobile'
        }
    ]
    
    for project in projects:
        cursor.execute('''
        INSERT OR REPLACE INTO projects 
        (id, name, description, status, manager_id, priority, repository_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (project['id'], project['name'], project['description'], 
              project['status'], project['manager_id'], project['priority'], 
              project['repository_url']))
        
        # Add team members to projects
        if project['name'] == 'Meridian Platform Enhancement':
            # Add professional and student to main project
            cursor.execute('''
            INSERT OR REPLACE INTO team_members (id, project_id, user_id, role)
            VALUES (?, ?, ?, ?)
            ''', (str(uuid.uuid4()), project['id'], professional_id, 'senior_developer'))
            
            cursor.execute('''
            INSERT OR REPLACE INTO team_members (id, project_id, user_id, role)
            VALUES (?, ?, ?, ?)
            ''', (str(uuid.uuid4()), project['id'], student_id, 'junior_developer'))
        
        elif project['name'] == 'Customer Analytics Dashboard':
            # Add professional to analytics project
            cursor.execute('''
            INSERT OR REPLACE INTO team_members (id, project_id, user_id, role)
            VALUES (?, ?, ?, ?)
            ''', (str(uuid.uuid4()), project['id'], professional_id, 'lead_developer'))
    
    # Add sample metrics
    project_id = projects[0]['id']  # Meridian Platform Enhancement
    
    metrics = [
        ('code_quality', 85.5),
        ('test_coverage', 78.2),
        ('velocity', 92.0),
        ('team_satisfaction', 88.7),
        ('deployment_frequency', 4.2),
        ('bug_fix_time', 2.1)
    ]
    
    for metric_type, value in metrics:
        cursor.execute('''
        INSERT INTO project_metrics (id, project_id, metric_type, metric_value)
        VALUES (?, ?, ?, ?)
        ''', (str(uuid.uuid4()), project_id, metric_type, value))
    
    print("✅ Sample data inserted successfully!")

if __name__ == "__main__":
    update_database_for_managers()

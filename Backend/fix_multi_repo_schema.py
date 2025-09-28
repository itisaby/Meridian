"""
Fixed database schema update for multi-repository support in projects
"""
import sqlite3
import uuid
from datetime import datetime

def update_schema_for_multi_repo():
    """Add support for multiple repositories per project"""
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    
    try:
        # Drop existing tables to recreate with correct schema
        cursor.execute("DROP TABLE IF EXISTS repository_assignments")
        cursor.execute("DROP TABLE IF EXISTS project_repositories")
        
        # Create project_repositories table with correct schema
        cursor.execute("""
            CREATE TABLE project_repositories (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                repository_url TEXT NOT NULL,
                repository_name TEXT NOT NULL,
                description TEXT,
                technology_stack TEXT,
                primary_language TEXT,
                branch TEXT DEFAULT 'main',
                is_primary BOOLEAN DEFAULT FALSE,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                UNIQUE(project_id, repository_url)
            )
        """)
        
        # Create repository_assignments table for user-repo-role mapping
        cursor.execute("""
            CREATE TABLE repository_assignments (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                repository_id TEXT NOT NULL,
                professional_id TEXT NOT NULL,
                role TEXT NOT NULL, -- frontend, backend, fullstack, devops, etc.
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (project_id) REFERENCES projects (id),
                FOREIGN KEY (repository_id) REFERENCES project_repositories (id),
                FOREIGN KEY (professional_id) REFERENCES users (id),
                UNIQUE(repository_id, professional_id, role)
            )
        """)
        
        conn.commit()
        print("✅ Multi-repository schema created successfully!")
        
        # Migrate existing projects to have at least one repository
        cursor.execute("""
            SELECT id, name, repository_url FROM projects 
            WHERE repository_url IS NOT NULL AND repository_url != ''
        """)
        
        existing_projects = cursor.fetchall()
        
        for project_id, project_name, repo_url in existing_projects:
            # Create a default repository for existing projects
            repo_id = str(uuid.uuid4())
            repo_name = repo_url.split('/')[-1].replace('.git', '') or f"{project_name}-main"
            
            cursor.execute("""
                INSERT INTO project_repositories 
                (id, project_id, repository_url, repository_name, description, primary_language, is_primary)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                repo_id, 
                project_id, 
                repo_url,
                repo_name,
                f"Main repository for {project_name}",
                "JavaScript",
                True
            ))
            
            # Migrate existing project assignments to repository assignments
            cursor.execute("""
                SELECT professional_id, role FROM project_assignments 
                WHERE project_id = ? AND is_active = TRUE
            """, (project_id,))
            
            assignments = cursor.fetchall()
            
            for professional_id, role in assignments:
                assignment_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO repository_assignments 
                    (id, project_id, repository_id, professional_id, role)
                    VALUES (?, ?, ?, ?, ?)
                """, (assignment_id, project_id, repo_id, professional_id, role))
        
        conn.commit()
        print(f"✅ Migrated {len(existing_projects)} existing projects to multi-repo structure!")
        
    except Exception as e:
        print(f"❌ Error updating schema: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    update_schema_for_multi_repo()

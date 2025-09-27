"""
Database initialization and operations
"""
import sqlite3
import json
import uuid
from datetime import datetime
from typing import Optional, Dict, List
from ..models import UserResponse, RepositoryResponse


def init_db():
    """Initialize the SQLite database with all required tables"""
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            role TEXT NOT NULL,
            skills TEXT,
            github_id TEXT UNIQUE,
            github_username TEXT,
            github_avatar_url TEXT,
            github_bio TEXT,
            github_location TEXT,
            github_company TEXT,
            github_blog TEXT,
            github_public_repos INTEGER DEFAULT 0,
            github_followers INTEGER DEFAULT 0,
            github_following INTEGER DEFAULT 0,
            github_access_token TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Repositories table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS repositories (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            repo_url TEXT NOT NULL,
            repo_name TEXT,
            analysis_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Learning paths table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS learning_paths (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            repo_id TEXT,
            persona TEXT,
            path_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (repo_id) REFERENCES repositories (id)
        )
    ''')
    
    # Collaboration sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS collaboration_sessions (
            id TEXT PRIMARY KEY,
            repo_id TEXT,
            participants TEXT,
            session_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (repo_id) REFERENCES repositories (id)
        )
    ''')

    # Profile system tables
    # User profiles table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            user_type TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            avatar_url TEXT,
            bio TEXT,
            location TEXT,
            timezone TEXT,
            github_username TEXT,
            linkedin_url TEXT,
            portfolio_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Skills table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_skills (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            proficiency_level INTEGER NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
            years_experience REAL,
            is_learning BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user_profiles (user_id),
            UNIQUE(user_id, name)
        )
    """)
    
    # Learning goals table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learning_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
            target_date DATE,
            status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')),
            progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user_profiles (user_id)
        )
    """)
    
    # Avatar files table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_avatars (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            filename TEXT NOT NULL,
            file_path TEXT NOT NULL,
            content_type TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user_profiles (user_id)
        )
    """)
    
    conn.commit()
    conn.close()


class DatabaseManager:
    """Database operations manager"""
    
    @staticmethod
    def get_connection():
        """Get database connection"""
        return sqlite3.connect('meridian.db')
    
    # User Operations
    @staticmethod
    def create_user(name: str, email: str, role: str, skills: List[str] = None) -> str:
        """Create a new user and return user ID"""
        user_id = str(uuid.uuid4())
        skills_json = json.dumps(skills or [])
        
        conn = DatabaseManager.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO users (id, name, email, role, skills) VALUES (?, ?, ?, ?, ?)",
            (user_id, name, email, role, skills_json)
        )
        
        conn.commit()
        conn.close()
        return user_id
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict]:
        """Get user by email"""
        conn = DatabaseManager.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, name, email, role, skills, created_at FROM users WHERE email = ?",
            (email,)
        )
        
        user_row = cursor.fetchone()
        conn.close()
        
        if user_row:
            user_id, name, email, role, skills_json, created_at = user_row
            skills = json.loads(skills_json) if skills_json else []
            return {
                "id": user_id,
                "name": name,
                "email": email,
                "role": role,
                "skills": skills,
                "created_at": created_at
            }
        return None
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        conn = DatabaseManager.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, name, email, role, skills, created_at FROM users WHERE id = ?",
            (user_id,)
        )
        
        user_row = cursor.fetchone()
        conn.close()
        
        if user_row:
            user_id, name, email, role, skills_json, created_at = user_row
            skills = json.loads(skills_json) if skills_json else []
            return {
                "id": user_id,
                "name": name,
                "email": email,
                "role": role,
                "skills": skills,
                "created_at": created_at
            }
        return None
    
    # Repository Operations
    @staticmethod
    def create_repository(user_id: str, repo_url: str, repo_name: str = None) -> str:
        """Create a new repository record"""
        repo_id = str(uuid.uuid4())
        
        conn = DatabaseManager.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO repositories (id, user_id, repo_url, repo_name) VALUES (?, ?, ?, ?)",
            (repo_id, user_id, repo_url, repo_name)
        )
        
        conn.commit()
        conn.close()
        return repo_id
    
    @staticmethod
    def get_repository_by_id(repo_id: str) -> Optional[Dict]:
        """Get repository by ID"""
        conn = DatabaseManager.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, user_id, repo_url, repo_name, analysis_data, created_at FROM repositories WHERE id = ?",
            (repo_id,)
        )
        
        repo_row = cursor.fetchone()
        conn.close()
        
        if repo_row:
            repo_id, user_id, repo_url, repo_name, analysis_data_json, created_at = repo_row
            analysis_data = json.loads(analysis_data_json) if analysis_data_json else None
            return {
                "id": repo_id,
                "user_id": user_id,
                "repo_url": repo_url,
                "repo_name": repo_name,
                "analysis_data": analysis_data,
                "created_at": created_at
            }
        return None
    
    @staticmethod
    def update_repository_analysis(repo_id: str, analysis_data: Dict):
        """Update repository analysis data"""
        conn = DatabaseManager.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE repositories SET analysis_data = ? WHERE id = ?",
            (json.dumps(analysis_data), repo_id)
        )
        
        conn.commit()
        conn.close()
    
    # Collaboration Operations
    @staticmethod
    def create_collaboration_session(repo_id: str, user_ids: List[str]) -> str:
        """Create a new collaboration session"""
        session_id = str(uuid.uuid4())
        
        conn = DatabaseManager.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO collaboration_sessions (id, repo_id, participants, session_data) VALUES (?, ?, ?, ?)",
            (session_id, repo_id, json.dumps(user_ids), json.dumps({}))
        )
        
        conn.commit()
        conn.close()
        return session_id
    
    # Demo user operations
    @staticmethod
    def create_demo_user(demo_id: str, name: str, email: str, role: str):
        """Create or update demo user"""
        conn = DatabaseManager.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT OR REPLACE INTO users (id, name, email, role, skills) VALUES (?, ?, ?, ?, ?)",
            (demo_id, name, email, role, json.dumps([]))
        )
        
        conn.commit()
        conn.close()

    # GitHub Authentication Methods
    @staticmethod
    def get_user_by_github_id(github_id: str) -> Optional[Dict]:
        """Get user by GitHub ID"""
        conn = DatabaseManager.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """SELECT id, name, email, role, skills, github_id, github_username, 
               github_avatar_url, created_at 
               FROM users WHERE github_id = ?""",
            (str(github_id),)
        )
        
        user_row = cursor.fetchone()
        conn.close()
        
        if user_row:
            user_id, name, email, role, skills_json, github_id, github_username, avatar_url, created_at = user_row
            skills = json.loads(skills_json) if skills_json else []
            return {
                "id": user_id,
                "name": name,
                "email": email or "",
                "role": role,
                "skills": skills,
                "github_id": github_id,
                "github_username": github_username,
                "avatar_url": avatar_url,
                "created_at": created_at
            }
        return None

    @staticmethod
    def create_user_from_github(github_id: str, username: str, name: str, email: str = None, 
                               avatar_url: str = None, bio: str = None, location: str = None,
                               company: str = None, blog: str = None, public_repos: int = 0,
                               followers: int = 0, following: int = 0, access_token: str = None) -> str:
        """Create a new user from GitHub OAuth data"""
        user_id = str(uuid.uuid4())
        # Default role for GitHub users is 'developer'
        role = 'developer'
        
        conn = DatabaseManager.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            """INSERT INTO users 
               (id, name, email, role, skills, github_id, github_username, github_avatar_url,
                github_bio, github_location, github_company, github_blog, github_public_repos,
                github_followers, github_following, github_access_token) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (user_id, name, email, role, json.dumps([]), str(github_id), username, avatar_url,
             bio, location, company, blog, public_repos, followers, following, access_token)
        )
        
        conn.commit()
        conn.close()
        return user_id

    @staticmethod
    def update_user_github_data(user_id: str, username: str = None, name: str = None, 
                               email: str = None, avatar_url: str = None, bio: str = None,
                               location: str = None, company: str = None, blog: str = None,
                               public_repos: int = None, followers: int = None, 
                               following: int = None, access_token: str = None):
        """Update existing user with latest GitHub data"""
        conn = DatabaseManager.get_connection()
        cursor = conn.cursor()
        
        updates = []
        values = []
        
        if username:
            updates.append("github_username = ?")
            values.append(username)
        if name:
            updates.append("name = ?")
            values.append(name)
        if email:
            updates.append("email = ?")
            values.append(email)
        if avatar_url:
            updates.append("github_avatar_url = ?")
            values.append(avatar_url)
        if bio:
            updates.append("github_bio = ?")
            values.append(bio)
        if location:
            updates.append("github_location = ?")
            values.append(location)
        if company:
            updates.append("github_company = ?")
            values.append(company)
        if blog:
            updates.append("github_blog = ?")
            values.append(blog)
        if public_repos is not None:
            updates.append("github_public_repos = ?")
            values.append(public_repos)
        if followers is not None:
            updates.append("github_followers = ?")
            values.append(followers)
        if following is not None:
            updates.append("github_following = ?")
            values.append(following)
        if access_token:
            updates.append("github_access_token = ?")
            values.append(access_token)
        
        if updates:
            values.append(user_id)
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, values)
            conn.commit()
        
        conn.close()

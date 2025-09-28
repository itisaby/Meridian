#!/usr/bin/env python3
"""
Create a manager user for testing the manager dashboard
"""
import sqlite3
import hashlib
import uuid
from datetime import datetime

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_manager_user():
    """Create a manager user in the database"""
    try:
        # Connect to the database
        conn = sqlite3.connect('meridian.db')
        cursor = conn.cursor()
        
        # User details
        user_id = str(uuid.uuid4())
        name = "Sarah Johnson"
        email = "sarah.johnson@meridian.ai"
        role = "manager"
        skills = "Project Management,Team Leadership,DevOps Strategy"
        github_username = "sarah-manager"
        created_at = datetime.now().isoformat()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"✅ Manager user already exists with email: {email}")
            print(f"   User ID: {existing_user[0]}")
            return existing_user[0]
        
        # Insert manager user (matching the existing schema)
        cursor.execute("""
            INSERT INTO users (
                id, name, email, role, skills, 
                github_username, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (user_id, name, email, role, skills, github_username, created_at))
        
        # Create user profile
        cursor.execute("""
            INSERT OR IGNORE INTO user_profiles 
            (user_id, user_type, first_name, last_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, role, "Sarah", "Johnson", created_at, created_at))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Manager user created successfully!")
        print(f"   Name: {name}")
        print(f"   Email: {email}")
        print(f"   Role: {role}")
        print(f"   GitHub Username: {github_username}")
        print(f"   User ID: {user_id}")
        print(f"   Note: This user uses GitHub authentication")
        
        return user_id
        
    except Exception as e:
        print(f"❌ Error creating manager user: {e}")
        return None

if __name__ == "__main__":
    create_manager_user()

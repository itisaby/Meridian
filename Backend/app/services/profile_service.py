"""
Database service for user profile management
"""
import sqlite3
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.models.profile import (
    UserProfile, Skill, LearningGoal, ProfileResponse, ProfileStatsResponse
)

class ProfileService:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_tables()
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_tables(self):
        """Initialize profile-related database tables"""
        with self.get_connection() as conn:
            # User profiles table
            conn.execute("""
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
            conn.execute("""
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
            conn.execute("""
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
            conn.execute("""
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
    
    def create_profile(self, user_id: str, profile_data: dict) -> UserProfile:
        """Create a new user profile"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO user_profiles (
                    user_id, user_type, first_name, last_name, bio, location, 
                    timezone, github_username, linkedin_url, portfolio_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, profile_data['user_type'], profile_data['first_name'],
                profile_data['last_name'], profile_data.get('bio'),
                profile_data.get('location'), profile_data.get('timezone'),
                profile_data.get('github_username'), profile_data.get('linkedin_url'),
                profile_data.get('portfolio_url')
            ))
            
            # Get the created profile
            profile_row = conn.execute(
                "SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)
            ).fetchone()
            
            return self._row_to_profile(profile_row)
    
    def get_profile(self, user_id: str) -> Optional[UserProfile]:
        """Get user profile by user_id"""
        with self.get_connection() as conn:
            profile_row = conn.execute(
                "SELECT * FROM user_profiles WHERE user_id = ?", (user_id,)
            ).fetchone()
            
            if profile_row:
                return self._row_to_profile(profile_row)
            return None
    
    def update_profile(self, user_id: str, update_data: dict) -> Optional[UserProfile]:
        """Update user profile"""
        if not update_data:
            return self.get_profile(user_id)
            
        set_clauses = []
        values = []
        
        for field, value in update_data.items():
            if value is not None:
                set_clauses.append(f"{field} = ?")
                values.append(value)
        
        if not set_clauses:
            return self.get_profile(user_id)
        
        set_clauses.append("updated_at = ?")
        values.append(datetime.utcnow())
        values.append(user_id)
        
        with self.get_connection() as conn:
            conn.execute(f"""
                UPDATE user_profiles 
                SET {', '.join(set_clauses)}
                WHERE user_id = ?
            """, values)
            
            return self.get_profile(user_id)
    
    def add_skill(self, user_id: str, skill_data: dict) -> Skill:
        """Add a skill for user"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                INSERT OR REPLACE INTO user_skills (
                    user_id, name, category, proficiency_level, 
                    years_experience, is_learning
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                user_id, skill_data['name'], skill_data['category'],
                skill_data['proficiency_level'], skill_data.get('years_experience'),
                skill_data.get('is_learning', False)
            ))
            
            skill_row = conn.execute(
                "SELECT * FROM user_skills WHERE user_id = ? AND name = ?",
                (user_id, skill_data['name'])
            ).fetchone()
            
            return self._row_to_skill(skill_row)
    
    def get_user_skills(self, user_id: str) -> List[Skill]:
        """Get all skills for a user"""
        with self.get_connection() as conn:
            skills_rows = conn.execute(
                "SELECT * FROM user_skills WHERE user_id = ? ORDER BY name",
                (user_id,)
            ).fetchall()
            
            return [self._row_to_skill(row) for row in skills_rows]
    
    def update_skill(self, user_id: str, skill_id: int, update_data: dict) -> Optional[Skill]:
        """Update a skill"""
        if not update_data:
            return None
            
        set_clauses = []
        values = []
        
        for field, value in update_data.items():
            if value is not None:
                set_clauses.append(f"{field} = ?")
                values.append(value)
        
        if not set_clauses:
            return None
        
        values.extend([user_id, skill_id])
        
        with self.get_connection() as conn:
            conn.execute(f"""
                UPDATE user_skills 
                SET {', '.join(set_clauses)}
                WHERE user_id = ? AND id = ?
            """, values)
            
            skill_row = conn.execute(
                "SELECT * FROM user_skills WHERE user_id = ? AND id = ?",
                (user_id, skill_id)
            ).fetchone()
            
            return self._row_to_skill(skill_row) if skill_row else None
    
    def delete_skill(self, user_id: str, skill_id: int) -> bool:
        """Delete a skill"""
        with self.get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM user_skills WHERE user_id = ? AND id = ?",
                (user_id, skill_id)
            )
            return cursor.rowcount > 0
    
    def create_learning_goal(self, user_id: str, goal_data: dict) -> LearningGoal:
        """Create a learning goal"""
        with self.get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO learning_goals (
                    user_id, title, description, category, priority, target_date
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                user_id, goal_data['title'], goal_data.get('description'),
                goal_data['category'], goal_data['priority'], 
                goal_data.get('target_date')
            ))
            
            goal_row = conn.execute(
                "SELECT * FROM learning_goals WHERE id = ?",
                (cursor.lastrowid,)
            ).fetchone()
            
            return self._row_to_learning_goal(goal_row)
    
    def get_user_learning_goals(self, user_id: str) -> List[LearningGoal]:
        """Get all learning goals for a user"""
        with self.get_connection() as conn:
            goals_rows = conn.execute(
                "SELECT * FROM learning_goals WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,)
            ).fetchall()
            
            return [self._row_to_learning_goal(row) for row in goals_rows]
    
    def update_learning_goal(self, user_id: str, goal_id: int, update_data: dict) -> Optional[LearningGoal]:
        """Update a learning goal"""
        if not update_data:
            return None
            
        set_clauses = []
        values = []
        
        for field, value in update_data.items():
            if value is not None:
                set_clauses.append(f"{field} = ?")
                values.append(value)
        
        if not set_clauses:
            return None
        
        set_clauses.append("updated_at = ?")
        values.append(datetime.utcnow())
        values.extend([user_id, goal_id])
        
        with self.get_connection() as conn:
            conn.execute(f"""
                UPDATE learning_goals 
                SET {', '.join(set_clauses)}
                WHERE user_id = ? AND id = ?
            """, values)
            
            goal_row = conn.execute(
                "SELECT * FROM learning_goals WHERE user_id = ? AND id = ?",
                (user_id, goal_id)
            ).fetchone()
            
            return self._row_to_learning_goal(goal_row) if goal_row else None
    
    def delete_learning_goal(self, user_id: str, goal_id: int) -> bool:
        """Delete a learning goal"""
        with self.get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM learning_goals WHERE user_id = ? AND id = ?",
                (user_id, goal_id)
            )
            return cursor.rowcount > 0
    
    def get_complete_profile(self, user_id: str) -> Optional[ProfileResponse]:
        """Get complete profile with skills and goals"""
        profile = self.get_profile(user_id)
        if not profile:
            return None
            
        skills = self.get_user_skills(user_id)
        goals = self.get_user_learning_goals(user_id)
        
        # Calculate stats
        skills_by_category = {}
        for skill in skills:
            skills_by_category[skill.category] = skills_by_category.get(skill.category, 0) + 1
        
        goals_by_status = {}
        for goal in goals:
            goals_by_status[goal.status] = goals_by_status.get(goal.status, 0) + 1
        
        return ProfileResponse(
            profile=profile,
            skills=skills,
            learning_goals=goals,
            total_skills=len(skills),
            skills_by_category=skills_by_category,
            goals_by_status=goals_by_status
        )
    
    def get_profile_stats(self, user_id: str) -> Optional[ProfileStatsResponse]:
        """Get profile statistics"""
        skills = self.get_user_skills(user_id)
        goals = self.get_user_learning_goals(user_id)
        
        # Skills analysis
        skills_by_category = {}
        skills_by_proficiency = {"Beginner": 0, "Basic": 0, "Intermediate": 0, "Advanced": 0, "Expert": 0}
        proficiency_map = {1: "Beginner", 2: "Basic", 3: "Intermediate", 4: "Advanced", 5: "Expert"}
        
        for skill in skills:
            if skill.category not in skills_by_category:
                skills_by_category[skill.category] = []
            skills_by_category[skill.category].append(skill.name)
            skills_by_proficiency[proficiency_map[skill.proficiency_level]] += 1
        
        # Goals analysis
        goals_by_status = {}
        goals_by_category = {}
        total_progress = 0
        
        for goal in goals:
            goals_by_status[goal.status] = goals_by_status.get(goal.status, 0) + 1
            goals_by_category[goal.category] = goals_by_category.get(goal.category, 0) + 1
            total_progress += goal.progress_percentage
        
        completion_rate = (total_progress / len(goals)) if goals else 0.0
        
        return ProfileStatsResponse(
            total_skills=len(skills),
            skills_by_category=skills_by_category,
            skills_by_proficiency=skills_by_proficiency,
            total_goals=len(goals),
            goals_by_status=goals_by_status,
            goals_by_category=goals_by_category,
            completion_rate=completion_rate
        )
    
    def _row_to_profile(self, row) -> UserProfile:
        """Convert database row to UserProfile model"""
        return UserProfile(
            id=row['id'],
            user_id=row['user_id'],
            user_type=row['user_type'],
            first_name=row['first_name'],
            last_name=row['last_name'],
            avatar_url=row['avatar_url'],
            bio=row['bio'],
            location=row['location'],
            timezone=row['timezone'],
            github_username=row['github_username'],
            linkedin_url=row['linkedin_url'],
            portfolio_url=row['portfolio_url'],
            created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None,
            updated_at=datetime.fromisoformat(row['updated_at']) if row['updated_at'] else None
        )
    
    def _row_to_skill(self, row) -> Skill:
        """Convert database row to Skill model"""
        return Skill(
            id=row['id'],
            user_id=row['user_id'],
            name=row['name'],
            category=row['category'],
            proficiency_level=row['proficiency_level'],
            years_experience=row['years_experience'],
            is_learning=bool(row['is_learning']),
            created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None
        )
    
    def _row_to_learning_goal(self, row) -> LearningGoal:
        """Convert database row to LearningGoal model"""
        return LearningGoal(
            id=row['id'],
            user_id=row['user_id'],
            title=row['title'],
            description=row['description'],
            category=row['category'],
            priority=row['priority'],
            target_date=datetime.fromisoformat(row['target_date']) if row['target_date'] else None,
            status=row['status'],
            progress_percentage=row['progress_percentage'],
            created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None,
            updated_at=datetime.fromisoformat(row['updated_at']) if row['updated_at'] else None
        )

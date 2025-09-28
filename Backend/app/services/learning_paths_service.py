"""
Learning Paths Database Models
Comprehensive system for personalized learning journeys based on repository analysis
"""
import sqlite3
import json
import uuid
from datetime import datetime
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict

@dataclass
class LearningResource:
    """Individual learning resource (video, article, exercise, etc.)"""
    id: str
    title: str
    description: str
    resource_type: str  # 'video', 'article', 'exercise', 'documentation', 'course'
    url: str
    difficulty_level: str  # 'beginner', 'intermediate', 'advanced'
    estimated_time_minutes: int
    tags: List[str]
    source: str  # 'youtube', 'documentation', 'blog', 'course_platform'
    rating: float = 0.0
    completion_rate: float = 0.0

@dataclass
class LearningModule:
    """A module within a learning path (e.g., "Docker Fundamentals")"""
    id: str
    title: str
    description: str
    learning_objectives: List[str]
    prerequisites: List[str]
    estimated_hours: int
    difficulty_level: str
    resources: List[LearningResource]
    hands_on_exercises: List[Dict[str, Any]]
    knowledge_checks: List[Dict[str, Any]]
    order_index: int

@dataclass
class LearningPath:
    """Complete learning journey for a specific DevOps concept"""
    id: str
    title: str
    description: str
    category: str  # 'CI/CD', 'Security', 'Infrastructure', 'Testing', 'Documentation'
    difficulty_level: str
    total_estimated_hours: int
    learning_goals: List[str]
    success_criteria: List[str]
    modules: List[LearningModule]
    prerequisites: List[str]
    tags: List[str]
    created_from_analysis_id: Optional[str] = None

@dataclass
class UserLearningGoal:
    """User's personal learning goal"""
    id: str
    user_id: str
    title: str
    description: str
    target_completion_date: str
    priority: str  # 'high', 'medium', 'low'
    category: str
    current_skill_level: str  # 'beginner', 'intermediate', 'advanced'
    target_skill_level: str
    motivation: str  # Why they want to learn this
    created_at: str
    status: str = 'active'  # 'active', 'completed', 'paused'

@dataclass
class UserProgress:
    """User's progress through a learning path"""
    id: str
    user_id: str
    learning_path_id: str
    learning_goal_id: str
    current_module_id: str
    completed_modules: List[str]
    completed_resources: List[str]
    total_time_spent_minutes: int
    progress_percentage: float
    started_at: str
    last_activity_at: str
    notes: str = ""
    status: str = 'in_progress'  # 'not_started', 'in_progress', 'completed', 'paused'

class LearningPathsService:
    """Service for managing learning paths and user progress"""
    
    def __init__(self, db_path: str = "meridian.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize learning paths database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Learning Paths table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS learning_paths (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                category TEXT,
                difficulty_level TEXT,
                total_estimated_hours INTEGER,
                learning_goals TEXT,  -- JSON array
                success_criteria TEXT,  -- JSON array
                modules TEXT,  -- JSON array of modules
                prerequisites TEXT,  -- JSON array
                tags TEXT,  -- JSON array
                created_from_analysis_id TEXT,
                created_at TEXT,
                updated_at TEXT
            )
        """)
        
        # User Learning Goals table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_learning_goals (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                target_completion_date TEXT,
                priority TEXT,
                category TEXT,
                current_skill_level TEXT,
                target_skill_level TEXT,
                motivation TEXT,
                status TEXT DEFAULT 'active',
                created_at TEXT,
                updated_at TEXT
            )
        """)
        
        # User Progress table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_learning_progress (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                learning_path_id TEXT,
                learning_goal_id TEXT,
                current_module_id TEXT,
                completed_modules TEXT,  -- JSON array
                completed_resources TEXT,  -- JSON array
                total_time_spent_minutes INTEGER DEFAULT 0,
                progress_percentage REAL DEFAULT 0.0,
                notes TEXT,
                status TEXT DEFAULT 'not_started',
                started_at TEXT,
                last_activity_at TEXT,
                created_at TEXT,
                updated_at TEXT,
                FOREIGN KEY (learning_path_id) REFERENCES learning_paths (id),
                FOREIGN KEY (learning_goal_id) REFERENCES user_learning_goals (id)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def create_learning_path_from_analysis(self, analysis_data: Dict[str, Any], user_id: str) -> LearningPath:
        """
        Create personalized learning paths based on AI analysis
        This is the core function that transforms AI suggestions into structured learning
        """
        suggestions = analysis_data.get('suggestions', [])
        repo_name = analysis_data.get('repository_name', 'Your Repository')
        
        learning_paths = []
        
        for suggestion in suggestions:
            # Extract key information
            category = suggestion.get('category', 'DevOps')
            priority = suggestion.get('priority', 'Medium')
            title = suggestion.get('title', '')
            description = suggestion.get('description', '')
            implementation_steps = suggestion.get('implementation_steps', [])
            resources = suggestion.get('resources', [])
            effort = suggestion.get('estimated_effort', '1-2 hours')
            
            # Create learning modules based on implementation steps
            modules = self._create_modules_from_steps(
                implementation_steps, resources, category, priority
            )
            
            # Generate learning path
            path_id = str(uuid.uuid4())
            learning_path = LearningPath(
                id=path_id,
                title=f"Master {title} for {repo_name}",
                description=f"{description}\\n\\nWhy is this important? Understanding {category.lower()} practices is crucial for modern software development because it directly impacts deployment reliability, security posture, and team productivity.",
                category=category,
                difficulty_level=self._map_priority_to_difficulty(priority),
                total_estimated_hours=self._parse_effort_to_hours(effort),
                learning_goals=self._generate_learning_goals(title, category),
                success_criteria=self._generate_success_criteria(title, category),
                modules=modules,
                prerequisites=self._generate_prerequisites(category),
                tags=[category.lower(), 'devops', 'best-practices'],
                created_from_analysis_id=analysis_data.get('id')
            )
            
            learning_paths.append(learning_path)
        
        return learning_paths
    
    def _create_modules_from_steps(self, steps: List[str], resources: List[str], category: str, priority: str) -> List[LearningModule]:
        """Convert implementation steps into structured learning modules"""
        modules = []
        
        # Module 1: Understanding the Why
        why_module = LearningModule(
            id=str(uuid.uuid4()),
            title=f"Understanding Why {category} Matters",
            description=f"Learn the fundamental principles and business value of {category} practices",
            learning_objectives=[
                f"Understand the core principles of {category}",
                f"Identify common challenges in {category}",
                f"Recognize the business impact of good {category} practices",
                "Connect theory to real-world scenarios"
            ],
            prerequisites=[],
            estimated_hours=1,
            difficulty_level="beginner",
            resources=self._generate_conceptual_resources(category),
            hands_on_exercises=[
                {
                    "title": f"Analyze Current {category} State",
                    "description": f"Assess your current {category.lower()} practices and identify gaps",
                    "estimated_minutes": 30,
                    "deliverable": "Gap analysis document"
                }
            ],
            knowledge_checks=[
                {
                    "question": f"What are the key benefits of implementing {category} best practices?",
                    "type": "reflection",
                    "estimated_minutes": 10
                }
            ],
            order_index=1
        )
        modules.append(why_module)
        
        # Module 2: Learning the How
        how_modules = self._create_implementation_modules(steps, resources, category)
        modules.extend(how_modules)
        
        # Module 3: Hands-on Practice
        practice_module = LearningModule(
            id=str(uuid.uuid4()),
            title="Hands-on Implementation",
            description="Apply your knowledge through practical exercises",
            learning_objectives=[
                "Implement the learned concepts in a real project",
                "Troubleshoot common issues",
                "Build confidence through practice"
            ],
            prerequisites=[m.id for m in how_modules],
            estimated_hours=2,
            difficulty_level="intermediate",
            resources=self._generate_practical_resources(category),
            hands_on_exercises=self._generate_hands_on_exercises(steps, category),
            knowledge_checks=[
                {
                    "question": "What challenges did you face during implementation?",
                    "type": "reflection",
                    "estimated_minutes": 15
                }
            ],
            order_index=len(how_modules) + 2
        )
        modules.append(practice_module)
        
        return modules
    
    def _create_implementation_modules(self, steps: List[str], resources: List[str], category: str) -> List[LearningModule]:
        """Create detailed implementation modules from steps"""
        modules = []
        
        for i, step in enumerate(steps):
            module_id = str(uuid.uuid4())
            module = LearningModule(
                id=module_id,
                title=f"Step {i + 1}: {self._extract_step_title(step)}",
                description=step,
                learning_objectives=[
                    f"Understand the purpose of: {step}",
                    "Learn the technical implementation details",
                    "Identify potential pitfalls and solutions",
                    "Connect this step to the broader workflow"
                ],
                prerequisites=[modules[i-1].id] if i > 0 else [],
                estimated_hours=1,
                difficulty_level="intermediate",
                resources=self._generate_step_specific_resources(step, resources, category),
                hands_on_exercises=[
                    {
                        "title": f"Implement {self._extract_step_title(step)}",
                        "description": step,
                        "estimated_minutes": 45,
                        "deliverable": "Working implementation"
                    }
                ],
                knowledge_checks=[
                    {
                        "question": f"Why is this step necessary in the {category} workflow?",
                        "type": "understanding",
                        "estimated_minutes": 5
                    }
                ],
                order_index=i + 2
            )
            modules.append(module)
        
        return modules
    
    def _generate_learning_goals(self, title: str, category: str) -> List[str]:
        """Generate learning goals based on suggestion"""
        return [
            f"Master the fundamental concepts behind {title}",
            f"Understand when and why to implement {category} best practices",
            f"Develop hands-on skills in {category} tooling and processes",
            f"Build confidence to make architectural decisions in {category}",
            "Connect learning to career advancement opportunities"
        ]
    
    def _generate_success_criteria(self, title: str, category: str) -> List[str]:
        """Generate success criteria for the learning path"""
        return [
            f"Can explain the business value of {title} to stakeholders",
            f"Successfully implements {category} practices in a personal project",
            f"Troubleshoots common {category} issues independently",
            f"Reviews and improves existing {category} implementations",
            "Mentors others on these concepts"
        ]
    
    def _generate_conceptual_resources(self, category: str) -> List[LearningResource]:
        """Generate conceptual learning resources"""
        # This would be enhanced with real web search and resource discovery
        return [
            LearningResource(
                id=str(uuid.uuid4()),
                title=f"Fundamentals of {category}",
                description=f"Comprehensive introduction to {category} principles",
                resource_type="article",
                url="https://example.com",  # Would be real URLs from web search
                difficulty_level="beginner",
                estimated_time_minutes=30,
                tags=[category.lower(), "fundamentals"],
                source="documentation"
            )
        ]
    
    def save_learning_path(self, learning_path: LearningPath) -> bool:
        """Save learning path to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Prepare the path data as JSON
            path_data = {
                'title': learning_path.title,
                'description': learning_path.description,
                'category': learning_path.category,
                'difficulty_level': learning_path.difficulty_level,
                'total_estimated_hours': learning_path.total_estimated_hours,
                'learning_goals': learning_path.learning_goals,
                'success_criteria': learning_path.success_criteria,
                'modules': [asdict(m) for m in learning_path.modules],
                'prerequisites': learning_path.prerequisites,
                'tags': learning_path.tags,
                'created_from_analysis_id': getattr(learning_path, 'created_from_analysis_id', None)
            }
            
            cursor.execute("""
                INSERT INTO learning_paths 
                (id, user_id, repo_id, persona, path_data, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                learning_path.id,
                getattr(learning_path, 'user_id', None),
                getattr(learning_path, 'repo_id', None),
                getattr(learning_path, 'persona', 'student'),
                json.dumps(path_data),
                datetime.now().isoformat()
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error saving learning path: {e}")
            return False
            return False
    
    def get_user_learning_paths(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all learning paths for a user"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get learning paths for the user from the actual table schema
        cursor.execute("""
            SELECT id, user_id, repo_id, persona, path_data, created_at
            FROM learning_paths 
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,))
        
        results = cursor.fetchall()
        conn.close()
        
        learning_paths = []
        for row in results:
            try:
                # Parse the path_data JSON
                path_data = json.loads(row[4]) if row[4] else {}
                
                # Create a learning path dict with fallback values
                learning_path = {
                    'id': row[0],
                    'title': path_data.get('title', 'Untitled Learning Path'),
                    'description': path_data.get('description', 'No description available'),
                    'category': path_data.get('category', 'General'),
                    'difficulty_level': path_data.get('difficulty_level', 'intermediate'),
                    'total_estimated_hours': path_data.get('total_estimated_hours', 8),
                    'learning_goals': path_data.get('learning_goals', []),
                    'success_criteria': path_data.get('success_criteria', []),
                    'modules': path_data.get('modules', []),
                    'prerequisites': path_data.get('prerequisites', []),
                    'tags': path_data.get('tags', []),
                    'repo_id': row[2],
                    'persona': row[3],
                    'progress_percentage': 0,  # TODO: Add progress tracking
                    'progress_status': 'not_started',
                    'created_at': row[5]
                }
                learning_paths.append(learning_path)
            except (json.JSONDecodeError, Exception) as e:
                print(f"Error parsing learning path data: {e}")
                # Add a minimal learning path entry even if parsing fails
                learning_paths.append({
                    'id': row[0],
                    'title': 'Learning Path (Data Error)',
                    'description': 'Error parsing learning path data',
                    'category': 'General',
                    'difficulty_level': 'intermediate',
                    'total_estimated_hours': 0,
                    'learning_goals': [],
                    'success_criteria': [],
                    'modules': [],
                    'prerequisites': [],
                    'tags': [],
                    'repo_id': row[2],
                    'persona': row[3],
                    'progress_percentage': 0,
                    'progress_status': 'not_started',
                    'created_at': row[5]
                })
        
        return learning_paths
    
    def get_learning_path_by_id(self, path_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed learning path information by ID"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM learning_paths WHERE id = ?", (path_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                'id': row[0],
                'title': row[1],
                'description': row[2],
                'category': row[3],
                'difficulty_level': row[4],
                'total_estimated_hours': row[5],
                'learning_goals': json.loads(row[6]) if row[6] else [],
                'success_criteria': json.loads(row[7]) if row[7] else [],
                'modules': json.loads(row[8]) if row[8] else [],
                'prerequisites': json.loads(row[9]) if row[9] else [],
                'tags': json.loads(row[10]) if row[10] else [],
                'created_from_analysis_id': row[11],
                'created_at': row[12],
                'updated_at': row[13]
            }
        return None
    
    def get_user_progress(self, user_id: str, learning_path_id: str) -> Optional[Dict[str, Any]]:
        """Get user's progress for a specific learning path"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM user_learning_progress 
            WHERE user_id = ? AND learning_path_id = ?
        """, (user_id, learning_path_id))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                'id': row[0],
                'user_id': row[1],
                'learning_path_id': row[2],
                'learning_goal_id': row[3],
                'current_module_id': row[4],
                'completed_modules': json.loads(row[5]) if row[5] else [],
                'completed_resources': json.loads(row[6]) if row[6] else [],
                'total_time_spent_minutes': row[7],
                'progress_percentage': row[8],
                'notes': row[9],
                'status': row[10],
                'started_at': row[11],
                'last_activity_at': row[12]
            }
        return None
    
    def save_learning_goal(self, goal: UserLearningGoal) -> bool:
        """Save a user learning goal to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO user_learning_goals 
                (id, user_id, title, description, target_completion_date, priority,
                 category, current_skill_level, target_skill_level, motivation,
                 status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                goal.id, goal.user_id, goal.title, goal.description,
                goal.target_completion_date, goal.priority, goal.category,
                goal.current_skill_level, goal.target_skill_level, goal.motivation,
                goal.status, goal.created_at, datetime.now().isoformat()
            ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error saving learning goal: {e}")
            return False
    
    def update_user_progress(self, user_id: str, learning_path_id: str, module_id: str,
                           resource_id: Optional[str] = None, time_spent_minutes: int = 0,
                           notes: Optional[str] = None, completed: bool = False) -> bool:
        """Update user's progress through a learning path"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get existing progress or create new
            cursor.execute("""
                SELECT * FROM user_learning_progress 
                WHERE user_id = ? AND learning_path_id = ?
            """, (user_id, learning_path_id))
            
            existing = cursor.fetchone()
            
            if existing:
                # Update existing progress
                completed_modules = json.loads(existing[5]) if existing[5] else []
                completed_resources = json.loads(existing[6]) if existing[6] else []
                total_time = existing[7] + time_spent_minutes
                
                if completed and module_id not in completed_modules:
                    completed_modules.append(module_id)
                
                if resource_id and resource_id not in completed_resources:
                    completed_resources.append(resource_id)
                
                # Calculate progress percentage
                cursor.execute("SELECT modules FROM learning_paths WHERE id = ?", (learning_path_id,))
                path_data = cursor.fetchone()
                if path_data:
                    modules = json.loads(path_data[0]) if path_data[0] else []
                    progress_percentage = (len(completed_modules) / len(modules)) * 100 if modules else 0
                else:
                    progress_percentage = existing[8]
                
                cursor.execute("""
                    UPDATE user_learning_progress 
                    SET current_module_id = ?, completed_modules = ?, completed_resources = ?,
                        total_time_spent_minutes = ?, progress_percentage = ?, notes = ?,
                        last_activity_at = ?, updated_at = ?
                    WHERE user_id = ? AND learning_path_id = ?
                """, (
                    module_id, json.dumps(completed_modules), json.dumps(completed_resources),
                    total_time, progress_percentage, notes or existing[9],
                    datetime.now().isoformat(), datetime.now().isoformat(),
                    user_id, learning_path_id
                ))
            else:
                # Create new progress record
                progress_id = str(uuid.uuid4())
                completed_modules = [module_id] if completed else []
                completed_resources = [resource_id] if resource_id else []
                
                cursor.execute("""
                    INSERT INTO user_learning_progress 
                    (id, user_id, learning_path_id, current_module_id, completed_modules,
                     completed_resources, total_time_spent_minutes, progress_percentage,
                     notes, status, started_at, last_activity_at, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    progress_id, user_id, learning_path_id, module_id,
                    json.dumps(completed_modules), json.dumps(completed_resources),
                    time_spent_minutes, 0.0, notes, 'in_progress',
                    datetime.now().isoformat(), datetime.now().isoformat(),
                    datetime.now().isoformat(), datetime.now().isoformat()
                ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating progress: {e}")
            return False
    
    # Helper methods for resource generation and parsing
    def _map_priority_to_difficulty(self, priority: str) -> str:
        mapping = {"High": "intermediate", "Medium": "beginner", "Low": "beginner"}
        return mapping.get(priority, "beginner")
    
    def _parse_effort_to_hours(self, effort: str) -> int:
        # Simple parser for effort strings like "2-4 hours", "1 day"
        if "hour" in effort:
            return int(effort.split()[0].split('-')[0])
        elif "day" in effort:
            return int(effort.split()[0]) * 8
        return 2
    
    def _extract_step_title(self, step: str) -> str:
        # Extract meaningful title from step description
        return step.split('.')[0][:50] + "..." if len(step) > 50 else step.split('.')[0]
    
    def _generate_step_specific_resources(self, step: str, resources: List[str], category: str) -> List[LearningResource]:
        # Generate specific resources for each step
        return []
    
    def _generate_practical_resources(self, category: str) -> List[LearningResource]:
        # Generate hands-on resources
        return []
    
    def _generate_hands_on_exercises(self, steps: List[str], category: str) -> List[Dict[str, Any]]:
        # Generate practical exercises
        return []
    
    def _generate_prerequisites(self, category: str) -> List[str]:
        # Generate prerequisites based on category
        prerequisites_map = {
            "CI/CD": ["Git basics", "Command line familiarity"],
            "Security": ["Basic networking", "Authentication concepts"],
            "Infrastructure": ["Linux basics", "Networking fundamentals"],
            "Testing": ["Programming fundamentals", "Testing concepts"],
            "Documentation": ["Writing skills", "Markdown basics"]
        }
        return prerequisites_map.get(category, ["Basic programming knowledge"])

# Global service instance
learning_paths_service = LearningPathsService()

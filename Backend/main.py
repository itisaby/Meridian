# Meridian Backend Skeleton
# File: main.py

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import json
import uuid
from datetime import datetime
import sqlite3
import aiofiles
import httpx
import os
from contextlib import asynccontextmanager

# Initialize FastAPI app
app = FastAPI(title="Meridian API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
def init_db():
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            skills TEXT,
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
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Pydantic models
class User(BaseModel):
    name: str
    email: str
    role: str  # student, professional, manager
    skills: Optional[List[str]] = []

class UserLogin(BaseModel):
    email: str
    password: str

class UserSignup(BaseModel):
    name: str
    email: str
    password: str
    role: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    skills: List[str]
    created_at: str

class AuthResponse(BaseModel):
    user: UserResponse
    token: str

class Repository(BaseModel):
    repo_url: str
    user_id: str

class AnalysisRequest(BaseModel):
    repo_id: str
    persona: str
    user_id: str

class CollaborationSession(BaseModel):
    repo_id: str
    user_ids: List[str]

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast_to_session(self, session_id: str, message: dict):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    pass

manager = ConnectionManager()

# Simulated MCP Client (replace with actual MCP implementation later)
class MCPClient:
    def __init__(self):
        self.servers = {
            "github": "mock_github_server",
            "aws": "mock_aws_server",
            "learning": "mock_learning_server"
        }
    
    async def call_tool(self, server: str, tool: str, params: dict) -> dict:
        # Mock MCP responses - replace with actual MCP calls during hackathon
        await asyncio.sleep(0.5)  # Simulate API delay
        
        if server == "github" and tool == "analyze_repository":
            return {
                "repo_health": 72,
                "issues_found": [
                    "Missing error handling in deployment script",
                    "Hardcoded credentials in config file",
                    "No proper logging configuration"
                ],
                "deployment_readiness": 68,
                "complexity_score": 45
            }
        
        elif server == "learning" and tool == "generate_learning_path":
            persona = params.get("persona", "student")
            if persona == "student":
                return {
                    "path": [
                        {"module": "Environment Variables", "duration": "30 min", "priority": "high"},
                        {"module": "Basic Docker", "duration": "2 hours", "priority": "high"},
                        {"module": "CI/CD Fundamentals", "duration": "1.5 hours", "priority": "medium"}
                    ],
                    "estimated_completion": "4 hours"
                }
            elif persona == "professional":
                return {
                    "suggestions": [
                        "Implement proper secret management",
                        "Add comprehensive error handling",
                        "Set up monitoring and alerting"
                    ],
                    "complexity": "intermediate"
                }
            else:  # manager
                return {
                    "team_insights": [
                        "Team needs Docker training",
                        "Security practices need improvement",
                        "Estimated fix time: 3-4 hours"
                    ],
                    "risk_level": "medium"
                }
        
        return {"status": "success", "data": "mock_response"}

mcp_client = MCPClient()

# AI Analysis Service (simplified)
class AIService:
    def __init__(self):
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "demo_key")
    
    async def analyze_with_persona(self, repo_data: dict, persona: str, context: dict) -> dict:
        # Simulate AI analysis - replace with actual OpenAI calls
        await asyncio.sleep(1)
        
        if persona == "student":
            return {
                "type": "learning_focused",
                "message": "I see several learning opportunities in your project!",
                "suggestions": [
                    "Let's start with environment configuration - this is a common issue",
                    "I'll create a step-by-step tutorial for Docker deployment",
                    "Here's a practice scenario based on your code"
                ],
                "learning_path": context.get("learning_path", {}),
                "difficulty": "beginner-friendly"
            }
        
        elif persona == "professional":
            return {
                "type": "technical_analysis",
                "message": "Infrastructure analysis complete. Here are optimization recommendations:",
                "suggestions": [
                    "Implement HashiCorp Vault for secret management",
                    "Add proper error boundaries in your deployment pipeline",
                    "Consider implementing blue-green deployment strategy"
                ],
                "technical_debt": 34,
                "estimated_fix_time": "3-4 hours"
            }
        
        else:  # manager
            return {
                "type": "team_insights",
                "message": "Team performance and project health analysis:",
                "insights": [
                    "Development velocity: 73% of team average",
                    "Knowledge gap identified in containerization",
                    "Recommend pairing junior dev with senior for this task"
                ],
                "team_health": 78,
                "recommended_actions": ["Schedule Docker workshop", "Assign mentor"]
            }

ai_service = AIService()

# API Routes

@app.get("/")
async def root():
    return {"message": "Meridian API is running!", "version": "1.0.0"}

# Authentication Routes
@app.post("/auth/signup", response_model=AuthResponse)
async def signup(user_data: UserSignup):
    user_id = str(uuid.uuid4())
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    
    try:
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Insert new user (in production, hash the password!)
        cursor.execute(
            "INSERT INTO users (id, name, email, role, skills) VALUES (?, ?, ?, ?, ?)",
            (user_id, user_data.name, user_data.email, user_data.role, json.dumps([]))
        )
        conn.commit()
        
        # Create response
        user_response = UserResponse(
            id=user_id,
            name=user_data.name,
            email=user_data.email,
            role=user_data.role,
            skills=[],
            created_at=datetime.now().isoformat()
        )
        
        # Generate token (in production, use proper JWT!)
        token = f"meridian_token_{user_id}"
        
        return AuthResponse(user=user_response, token=token)
        
    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Signup failed: {str(e)}")
    finally:
        conn.close()

@app.post("/auth/login", response_model=AuthResponse)
async def login(login_data: UserLogin):
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    
    try:
        # Find user by email (in production, verify hashed password!)
        cursor.execute(
            "SELECT id, name, email, role, skills, created_at FROM users WHERE email = ?",
            (login_data.email,)
        )
        user_row = cursor.fetchone()
        
        if not user_row:
            # Create demo users if they don't exist
            demo_users = [
                ("demo_student_id", "Demo Student", "student@demo.com", "student"),
                ("demo_dev_id", "Demo Developer", "dev@demo.com", "professional"), 
                ("demo_manager_id", "Demo Manager", "manager@demo.com", "manager")
            ]
            
            for demo_id, demo_name, demo_email, demo_role in demo_users:
                if login_data.email == demo_email:
                    cursor.execute(
                        "INSERT OR REPLACE INTO users (id, name, email, role, skills) VALUES (?, ?, ?, ?, ?)",
                        (demo_id, demo_name, demo_email, demo_role, json.dumps([]))
                    )
                    conn.commit()
                    user_row = (demo_id, demo_name, demo_email, demo_role, json.dumps([]), datetime.now().isoformat())
                    break
            
            if not user_row:
                raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user_id, name, email, role, skills_json, created_at = user_row
        skills = json.loads(skills_json) if skills_json else []
        
        # Create response
        user_response = UserResponse(
            id=user_id,
            name=name,
            email=email,
            role=role,
            skills=skills,
            created_at=created_at
        )
        
        # Generate token (in production, use proper JWT!)
        token = f"meridian_token_{user_id}"
        
        return AuthResponse(user=user_response, token=token)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")
    finally:
        conn.close()

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user(authorization: str = None):
    # Simple token validation (in production, use proper JWT validation!)
    if not authorization or not authorization.startswith("Bearer meridian_token_"):
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = authorization.replace("Bearer meridian_token_", "")
    
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "SELECT id, name, email, role, skills, created_at FROM users WHERE id = ?",
            (user_id,)
        )
        user_row = cursor.fetchone()
        
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id, name, email, role, skills_json, created_at = user_row
        skills = json.loads(skills_json) if skills_json else []
        
        return UserResponse(
            id=user_id,
            name=name,
            email=email,
            role=role,
            skills=skills,
            created_at=created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user: {str(e)}")
    finally:
        conn.close()

@app.post("/auth/logout")
async def logout():
    # In production, invalidate the token
    return {"message": "Logged out successfully"}

@app.post("/users")
async def create_user(user: User):
    user_id = str(uuid.uuid4())
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "INSERT INTO users (id, name, email, role, skills) VALUES (?, ?, ?, ?, ?)",
            (user_id, user.name, user.email, user.role, json.dumps(user.skills))
        )
        conn.commit()
        return {"user_id": user_id, "status": "created"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="User already exists")
    finally:
        conn.close()

@app.get("/users/{user_id}")
async def get_user(user_id: str):
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user[0],
        "name": user[1],
        "email": user[2],
        "role": user[3],
        "skills": json.loads(user[4]) if user[4] else [],
        "created_at": user[5]
    }

@app.post("/repositories")
async def add_repository(repo: Repository):
    repo_id = str(uuid.uuid4())
    
    # Basic GitHub URL validation
    if not ("github.com" in repo.repo_url or "gitlab.com" in repo.repo_url):
        raise HTTPException(status_code=400, detail="Invalid repository URL")
    
    repo_name = repo.repo_url.split("/")[-1]
    
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO repositories (id, user_id, repo_url, repo_name) VALUES (?, ?, ?, ?)",
        (repo_id, repo.user_id, repo.repo_url, repo_name)
    )
    conn.commit()
    conn.close()
    
    return {"repo_id": repo_id, "status": "added", "repo_name": repo_name}

@app.post("/analyze")
async def analyze_repository(request: AnalysisRequest):
    # Get repository data
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM repositories WHERE id = ?", (request.repo_id,))
    repo = cursor.fetchone()
    conn.close()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    
    # Get GitHub analysis via MCP
    repo_analysis = await mcp_client.call_tool(
        "github", "analyze_repository", 
        {"repo_url": repo[2]}
    )
    
    # Get learning path based on persona
    learning_context = await mcp_client.call_tool(
        "learning", "generate_learning_path",
        {"persona": request.persona, "repo_analysis": repo_analysis}
    )
    
    # Get AI analysis with persona
    ai_analysis = await ai_service.analyze_with_persona(
        repo_analysis, request.persona, learning_context
    )
    
    # Save analysis
    analysis_data = {
        "repo_analysis": repo_analysis,
        "learning_context": learning_context,
        "ai_analysis": ai_analysis,
        "analyzed_at": datetime.now().isoformat()
    }
    
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE repositories SET analysis_data = ? WHERE id = ?",
        (json.dumps(analysis_data), request.repo_id)
    )
    conn.commit()
    conn.close()
    
    return {
        "analysis": ai_analysis,
        "repo_health": repo_analysis.get("repo_health", 0),
        "deployment_readiness": repo_analysis.get("deployment_readiness", 0),
        "timestamp": analysis_data["analyzed_at"]
    }

@app.get("/repositories/{repo_id}/analysis")
async def get_analysis(repo_id: str):
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    cursor.execute("SELECT analysis_data FROM repositories WHERE id = ?", (repo_id,))
    result = cursor.fetchone()
    conn.close()
    
    if not result or not result[0]:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return json.loads(result[0])

@app.post("/collaboration/start")
async def start_collaboration(session: CollaborationSession):
    session_id = str(uuid.uuid4())
    
    conn = sqlite3.connect('meridian.db')
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO collaboration_sessions (id, repo_id, participants) VALUES (?, ?, ?)",
        (session_id, session.repo_id, json.dumps(session.user_ids))
    )
    conn.commit()
    conn.close()
    
    return {"session_id": session_id, "status": "started"}

# WebSocket endpoint for real-time collaboration
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Add timestamp and broadcast to session
            message["timestamp"] = datetime.now().isoformat()
            await manager.broadcast_to_session(session_id, message)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "database": "connected"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
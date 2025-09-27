"""
WebSocket and real-time collaboration features
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Header
from typing import Dict, List
import json
import uuid

from ..models import CollaborationSession
from ..database import DatabaseManager
from .auth import extract_token_from_header, get_user_from_token


router = APIRouter(tags=["collaboration"])


# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections for real-time collaboration"""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept and store WebSocket connection"""
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        """Remove WebSocket connection"""
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def broadcast_to_session(self, session_id: str, message: dict):
        """Broadcast message to all connections in a session"""
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    # Connection might be closed, ignore errors
                    pass

    def get_session_count(self, session_id: str) -> int:
        """Get number of active connections in a session"""
        return len(self.active_connections.get(session_id, []))


# Global connection manager instance
manager = ConnectionManager()


@router.post("/collaboration/start")
async def start_collaboration_session(
    collaboration: CollaborationSession, 
    authorization: str = Header(None)
):
    """Start a new collaboration session"""
    # Authenticate user
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        # Verify repository exists and user has access
        repo_data = DatabaseManager.get_repository_by_id(collaboration.repo_id)
        if not repo_data:
            raise HTTPException(status_code=404, detail="Repository not found")
        
        if repo_data["user_id"] != user_data["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Add current user to participants if not already included
        if user_data["id"] not in collaboration.user_ids:
            collaboration.user_ids.append(user_data["id"])
        
        # Create collaboration session
        session_id = DatabaseManager.create_collaboration_session(
            collaboration.repo_id,
            collaboration.user_ids
        )
        
        return {
            "session_id": session_id,
            "repo_id": collaboration.repo_id,
            "participants": collaboration.user_ids,
            "websocket_url": f"/ws/{session_id}",
            "created_at": "2025-09-26T02:00:00Z"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start collaboration session: {str(e)}")


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time collaboration"""
    await manager.connect(websocket, session_id)
    
    try:
        # Send welcome message
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "session_id": session_id,
            "participant_count": manager.get_session_count(session_id),
            "message": "Connected to collaboration session"
        }))
        
        # Notify other participants about new connection
        await manager.broadcast_to_session(session_id, {
            "type": "participant_joined",
            "session_id": session_id,
            "participant_count": manager.get_session_count(session_id),
            "timestamp": "2025-09-26T02:00:00Z"
        })
        
        # Listen for messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Process different message types
            if message.get("type") == "code_change":
                # Broadcast code changes to all participants
                await manager.broadcast_to_session(session_id, {
                    "type": "code_change",
                    "session_id": session_id,
                    "user_id": message.get("user_id"),
                    "changes": message.get("changes"),
                    "timestamp": "2025-09-26T02:00:00Z"
                })
            
            elif message.get("type") == "cursor_position":
                # Broadcast cursor positions
                await manager.broadcast_to_session(session_id, {
                    "type": "cursor_position",
                    "session_id": session_id,
                    "user_id": message.get("user_id"),
                    "position": message.get("position"),
                    "timestamp": "2025-09-26T02:00:00Z"
                })
            
            elif message.get("type") == "chat_message":
                # Broadcast chat messages
                await manager.broadcast_to_session(session_id, {
                    "type": "chat_message",
                    "session_id": session_id,
                    "user_id": message.get("user_id"),
                    "message": message.get("message"),
                    "timestamp": "2025-09-26T02:00:00Z"
                })
            
            elif message.get("type") == "analysis_request":
                # Handle collaborative analysis requests
                await manager.broadcast_to_session(session_id, {
                    "type": "analysis_started",
                    "session_id": session_id,
                    "user_id": message.get("user_id"),
                    "analysis_type": message.get("analysis_type"),
                    "timestamp": "2025-09-26T02:00:00Z"
                })
    
    except WebSocketDisconnect:
        # Handle disconnection
        manager.disconnect(websocket, session_id)
        
        # Notify other participants about disconnection
        await manager.broadcast_to_session(session_id, {
            "type": "participant_left",
            "session_id": session_id,
            "participant_count": manager.get_session_count(session_id),
            "timestamp": "2025-09-26T02:00:00Z"
        })
    
    except Exception as e:
        # Handle other errors
        manager.disconnect(websocket, session_id)
        print(f"WebSocket error in session {session_id}: {str(e)}")

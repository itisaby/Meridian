"""
HTTP Server wrapper for MCP DevOps Tools
Provides REST API endpoints for DevOps culture assessment
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging
import uvicorn
from devops_culture_tools import (
    devops_culture_assessment,
    personalized_devops_guidance,
    generate_adaptive_questions,
    analyze_progress_trends
)
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini AI
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-pro')
else:
    print("⚠️  GEMINI_API_KEY not found in environment variables")
    model = None

app = FastAPI(title="MCP DevOps Culture API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp-devops-api")

# Pydantic models
class AssessmentRequest(BaseModel):
    user_id: str
    assessment_responses: Dict[str, int]
    user_history: Optional[List[Dict]] = []
    analysis_type: Optional[str] = "comprehensive"

class QuestionRequest(BaseModel):
    user_id: str
    user_history: List[Dict]
    current_level: str
    question_count: Optional[int] = 15

class GuidanceRequest(BaseModel):
    user_id: str
    assessment_result: Dict[str, Any]

class RoadmapRequest(BaseModel):
    user_id: str
    assessment_id: str
    current_scores: Dict[str, int]

@app.get("/")
async def root():
    return {
        "message": "MCP DevOps Culture API Server",
        "version": "1.0.0",
        "status": "running",
        "gemini_configured": model is not None
    }

@app.post("/devops/assess")
async def assess_devops_culture(request: AssessmentRequest):
    """
    🤖 AI-Powered DevOps Culture Assessment using Gemini
    """
    try:
        logger.info(f"Starting DevOps assessment for user: {request.user_id}")
        
        # Prepare assessment context
        assessment_context = {
            "user_info": {
                "id": request.user_id,
                "assessment_history": request.user_history
            },
            "assessment_responses": request.assessment_responses,
            "user_history": request.user_history,
            "analysis_type": request.analysis_type
        }
        
        # Call the DevOps culture assessment tool
        result = await devops_culture_assessment(
            assessment_context=assessment_context,
            analysis_type=request.analysis_type,
            gemini_model=model
        )
        
        logger.info(f"Assessment completed for user: {request.user_id}")
        return result
        
    except Exception as e:
        logger.error(f"Assessment failed: {e}")
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")

@app.post("/devops/generate-questions")
async def generate_personalized_questions(request: QuestionRequest):
    """
    Generate personalized DevOps questions based on user history and level
    """
    try:
        logger.info(f"Generating personalized questions for user: {request.user_id}")
        
        # Call the question generation tool
        questions = await generate_adaptive_questions(
            user_history=request.user_history,
            current_level=request.current_level,
            question_count=request.question_count,
            gemini_model=model
        )
        
        return {"questions": questions}
        
    except Exception as e:
        logger.error(f"Question generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@app.post("/devops/guidance")
async def get_personalized_guidance(request: GuidanceRequest):
    """
    Get AI-powered personalized DevOps guidance
    """
    try:
        logger.info(f"Generating personalized guidance for user: {request.user_id}")
        
        # Call the guidance tool
        guidance = await personalized_devops_guidance(
            assessment_result=request.assessment_result,
            gemini_model=model
        )
        
        return guidance
        
    except Exception as e:
        logger.error(f"Guidance generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Guidance generation failed: {str(e)}")

@app.post("/devops/roadmap")
async def generate_transformation_roadmap(request: RoadmapRequest):
    """
    Generate AI-powered transformation roadmap
    """
    try:
        logger.info(f"Generating transformation roadmap for user: {request.user_id}")
        
        # Create roadmap context
        roadmap_context = {
            "user_id": request.user_id,
            "assessment_id": request.assessment_id,
            "current_scores": request.current_scores
        }
        
        # For now, generate a structured roadmap
        # This should call a dedicated roadmap generation function
        roadmap = {
            "roadmap_id": f"roadmap_{request.assessment_id}",
            "phases": [
                {
                    "phase": 1,
                    "name": "Foundation Building",
                    "duration": "4-6 weeks",
                    "focus_areas": ["Basic automation", "Team collaboration"],
                    "milestones": ["CI/CD pipeline setup", "Daily standups established"]
                },
                {
                    "phase": 2, 
                    "name": "Process Optimization",
                    "duration": "6-8 weeks",
                    "focus_areas": ["Monitoring", "Testing automation"],
                    "milestones": ["Comprehensive monitoring", "Automated testing pipeline"]
                }
            ],
            "estimated_duration": "3-4 months",
            "success_metrics": ["Deployment frequency", "Lead time", "MTTR"]
        }
        
        return roadmap
        
    except Exception as e:
        logger.error(f"Roadmap generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")

if __name__ == "__main__":
    # Run the HTTP server
    uvicorn.run(app, host="0.0.0.0", port=3001, log_level="info")

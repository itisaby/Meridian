"""
DevOps Culture Assessment and Guidance Routes
Navigate teams to operational excellence with AI-powered cultural guidance
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
import sqlite3
import json
from datetime import datetime, timedelta
from pydantic import BaseModel
import uuid
import logging
from app.mcp_client import mcp_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/devops-culture", tags=["devops-culture"])

DB_PATH = "meridian.db"

def get_db_connection():
    """Get database connection"""
    return sqlite3.connect(DB_PATH)

# Pydantic models for DevOps culture assessment
class DevOpsPractice(BaseModel):
    category: str
    practice_name: str
    adoption_level: int  # 0-100
    importance: str  # critical, high, medium, low
    current_tools: List[str]
    gaps: List[str]
    recommendations: List[str]

class CultureAssessment(BaseModel):
    team_id: str
    project_id: str
    assessment_date: datetime
    maturity_level: str  # beginner, intermediate, advanced, expert
    overall_score: int  # 0-100
    practices: List[DevOpsPractice]
    cultural_health: Dict[str, int]
    improvement_areas: List[str]

class TransformationRoadmap(BaseModel):
    assessment_id: str
    phases: List[Dict[str, Any]]
    estimated_duration: str
    success_metrics: List[str]
    milestones: List[Dict[str, Any]]

# DevOps Culture Categories and Practices
DEVOPS_CATEGORIES = {
    "ci_cd": {
        "name": "Continuous Integration/Continuous Deployment",
        "practices": [
            "Automated Testing", "Code Integration", "Deployment Automation", 
            "Release Management", "Pipeline Monitoring", "Rollback Procedures"
        ]
    },
    "collaboration": {
        "name": "Team Collaboration & Communication",
        "practices": [
            "Cross-functional Teams", "Daily Standups", "Code Reviews", 
            "Knowledge Sharing", "Documentation", "Incident Response"
        ]
    },
    "monitoring": {
        "name": "Monitoring & Observability",
        "practices": [
            "Application Monitoring", "Infrastructure Monitoring", "Log Management", 
            "Alerting", "Performance Tracking", "User Experience Monitoring"
        ]
    },
    "automation": {
        "name": "Infrastructure & Process Automation",
        "practices": [
            "Infrastructure as Code", "Configuration Management", "Automated Provisioning", 
            "Security Automation", "Compliance Automation", "Self-Service Platforms"
        ]
    },
    "culture": {
        "name": "Cultural Practices & Mindset",
        "practices": [
            "Blame-free Culture", "Continuous Learning", "Experimentation", 
            "Feedback Loops", "Psychological Safety", "Shared Responsibility"
        ]
    }
}

@router.post("/assess/team/{team_id}")
async def assess_team_devops_culture(team_id: str, project_id: Optional[str] = None):
    """Assess a team's current DevOps culture and practices"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get team information
        if project_id:
            cursor.execute('''
            SELECT tm.user_id, u.name, u.role, p.name as project_name, p.repository_url
            FROM team_members tm
            JOIN users u ON tm.user_id = u.id
            JOIN projects p ON tm.project_id = p.id
            WHERE p.id = ? AND tm.status = 'active'
            ''', (project_id,))
        else:
            cursor.execute('''
            SELECT u.id, u.name, u.role, 'General Assessment' as project_name, '' as repository_url
            FROM users u
            WHERE u.id = ?
            ''', (team_id,))
        
        team_data = cursor.fetchall()
        if not team_data:
            raise HTTPException(status_code=404, detail="Team or project not found")
        
        # Get project metrics if available
        project_metrics = {}
        if project_id:
            cursor.execute('''
            SELECT metric_type, metric_value, recorded_at
            FROM project_metrics 
            WHERE project_id = ?
            ORDER BY recorded_at DESC
            LIMIT 20
            ''', (project_id,))
            metrics_data = cursor.fetchall()
            project_metrics = {metric[0]: {"value": metric[1], "recorded_at": metric[2]} for metric in metrics_data}
        
        # Generate comprehensive DevOps assessment
        assessment = generate_devops_assessment(team_data, project_metrics, project_id or team_id)
        
        # Store assessment in database
        assessment_id = str(uuid.uuid4())
        cursor.execute('''
        INSERT INTO devops_assessments 
        (id, team_id, project_id, assessment_data, maturity_level, overall_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            assessment_id,
            team_id,
            project_id,
            json.dumps(assessment),
            assessment["maturity_level"],
            assessment["overall_score"],
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        return {
            "assessment_id": assessment_id,
            "assessment": assessment,
            "recommendations": generate_ai_recommendations(assessment),
            "next_steps": generate_next_steps(assessment)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_devops_assessment(team_data, project_metrics, project_id):
    """Generate comprehensive DevOps culture assessment"""
    team_size = len(team_data)
    
    # Calculate practice adoption scores
    practices_assessment = []
    overall_scores = []
    
    for category_id, category_info in DEVOPS_CATEGORIES.items():
        for practice in category_info["practices"]:
            # Simulate assessment based on team composition and metrics
            adoption_level = calculate_practice_adoption(practice, team_data, project_metrics)
            
            practice_assessment = {
                "category": category_info["name"],
                "practice_name": practice,
                "adoption_level": adoption_level,
                "importance": determine_practice_importance(practice, team_data),
                "current_tools": get_current_tools(practice, project_metrics),
                "gaps": identify_gaps(practice, adoption_level),
                "recommendations": get_practice_recommendations(practice, adoption_level)
            }

# NEW MCP-POWERED ENDPOINTS FOR AI-DRIVEN DEVOPS CULTURE GUIDANCE

@router.post("/ai-assessment/{team_id}")
async def ai_powered_culture_assessment(
    team_id: str, 
    assessment_data: Dict[str, Any]
):
    """
    🤖 AI-Powered DevOps Culture Assessment using MCP + Gemini
    Navigate teams to operational excellence with AI-powered cultural guidance
    """
    try:
        # Get team context from database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get comprehensive team information
        cursor.execute("""
        SELECT p.id, p.name, p.description, p.manager_id, p.repository_url,
               COUNT(tm.user_id) as team_size,
               GROUP_CONCAT(u.role) as team_roles,
               GROUP_CONCAT(u.name) as team_members
        FROM projects p
        LEFT JOIN team_members tm ON p.id = tm.project_id
        LEFT JOIN users u ON tm.user_id = u.id
        WHERE p.id = ? OR p.name = ?
        GROUP BY p.id
        """, (team_id, team_id))
        
        team_info = cursor.fetchone()
        if not team_info:
            raise HTTPException(status_code=404, detail="Team/Project not found")
        
        # Get recent project metrics for AI context
        cursor.execute("""
        SELECT metric_type, metric_value, recorded_at, 
               AVG(metric_value) OVER (PARTITION BY metric_type ORDER BY recorded_at 
               ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as trend_avg
        FROM project_metrics 
        WHERE project_id = ?
        ORDER BY recorded_at DESC
        LIMIT 20
        """, (team_info[0],))
        
        metrics = cursor.fetchall()
        
        # Get team member details for better assessment
        cursor.execute("""
        SELECT u.id, u.name, u.role, u.github_username, tm.role as project_role,
               tm.joined_at, u.created_at
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.project_id = ? AND tm.status = 'active'
        """, (team_info[0],))
        
        team_members = cursor.fetchall()
        conn.close()
        
        # Prepare comprehensive context for AI analysis
        ai_assessment_context = {
            "team_info": {
                "id": team_info[0],
                "name": team_info[1],
                "description": team_info[2],
                "manager_id": team_info[3],
                "repository_url": team_info[4],
                "team_size": team_info[5] or 0,
                "roles_distribution": team_info[6].split(',') if team_info[6] else [],
                "team_members_names": team_info[7].split(',') if team_info[7] else []
            },
            "assessment_responses": assessment_data,
            "metrics_history": [
                {
                    "type": metric[0],
                    "current_value": metric[1],
                    "recorded_at": metric[2],
                    "trend_avg": metric[3]
                } for metric in metrics
            ],
            "team_composition": [
                {
                    "id": member[0],
                    "name": member[1],
                    "role": member[2],
                    "github_username": member[3],
                    "project_role": member[4],
                    "joined_at": member[5],
                    "experience_level": calculate_experience_level(member[6])
                } for member in team_members
            ],
            "assessment_timestamp": datetime.now().isoformat(),
            "context_type": "comprehensive_ai_assessment"
        }
        
        # Call MCP/Gemini for AI-powered analysis
        ai_assessment_result = await call_mcp_for_culture_assessment(ai_assessment_context)
        
        # Save AI assessment to database
        assessment_id = str(uuid.uuid4())
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Create culture_assessments table if it doesn't exist
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS culture_assessments (
            id TEXT PRIMARY KEY,
            team_id TEXT,
            assessment_data TEXT,
            ai_analysis TEXT,
            maturity_score INTEGER,
            recommendations TEXT,
            created_at TEXT,
            assessment_type TEXT DEFAULT 'ai_powered'
        )
        """)
        
        cursor.execute("""
        INSERT INTO culture_assessments 
        (id, team_id, assessment_data, ai_analysis, maturity_score, recommendations, created_at, assessment_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            assessment_id,
            team_info[0],
            json.dumps(assessment_data),
            json.dumps(ai_assessment_result),
            ai_assessment_result.get('maturity_score', 0),
            json.dumps(ai_assessment_result.get('recommendations', [])),
            datetime.now().isoformat(),
            'ai_powered_mcp'
        ))
        
        conn.commit()
        conn.close()
        
        return {
            "🎯 assessment_id": assessment_id,
            "🏗️ team_context": ai_assessment_context["team_info"],
            "🤖 ai_analysis": ai_assessment_result,
            "📈 maturity_score": ai_assessment_result.get('maturity_score', 0),
            "🚀 transformation_roadmap": ai_assessment_result.get('transformation_roadmap', {}),
            "⚡ next_steps": ai_assessment_result.get('next_steps', []),
            "💡 ai_insights": ai_assessment_result.get('ai_analysis', 'AI analysis completed'),
            "⏰ estimated_timeline": ai_assessment_result.get('estimated_transformation_time', '6 months'),
            "powered_by": "🧭 Meridian MCP + Gemini AI"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI assessment failed: {str(e)}")

# Assessment submission endpoint for frontend integration
class AssessmentSubmission(BaseModel):
    user_id: str
    responses: Dict[str, int]
    metadata: Optional[Dict[str, Any]] = None

@router.post("/submit-assessment")
async def submit_assessment(submission: AssessmentSubmission):
    """
    🤖 AI-Powered DevOps Assessment with MCP + Gemini Integration
    Dynamic scoring based on user history and personalized analysis
    """
    try:
        logger.info(f"Starting AI-powered assessment for user: {submission.user_id}")
        
        # Generate unique assessment ID
        assessment_id = str(uuid.uuid4())
        
        # Get user's assessment history and handle MCP analysis with proper connection management
        user_history = []
        mcp_result = {}
        overall_score = 0
        maturity_level = "Novice"
        category_scores = {}
        strengths = []
        improvement_areas = []
        ai_recommendations = []
        dora_metrics_prediction = {}
        
        try:
            # Get user history for personalized analysis
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Ensure database tables exist with all columns
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS devops_assessments (
                assessment_id TEXT PRIMARY KEY,
                user_id TEXT,
                overall_score REAL,
                maturity_level TEXT,
                category_scores TEXT,
                strengths TEXT,
                improvement_areas TEXT,
                ai_recommendations TEXT,
                dora_metrics_prediction TEXT,
                responses TEXT,
                mcp_analysis TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            ''')
            
            # Get user history for personalized analysis
            cursor.execute('''
            SELECT assessment_id, overall_score, maturity_level, category_scores, 
                   created_at, mcp_analysis
            FROM devops_assessments 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 5
            ''', (submission.user_id,))
            
            for row in cursor.fetchall():
                user_history.append({
                    "assessment_id": row[0],
                    "overall_score": row[1],
                    "maturity_level": row[2], 
                    "category_scores": json.loads(row[3]) if row[3] else {},
                    "created_at": row[4],
                    "mcp_analysis": json.loads(row[5]) if row[5] else {}
                })
            
            logger.info(f"Found {len(user_history)} previous assessments for user {submission.user_id}")
            conn.close()  # Close after reading history
            
            # Call MCP server for AI-powered analysis (outside database context)
            mcp_result = await mcp_client.assess_devops_culture(
                user_id=submission.user_id,
                assessment_responses=submission.responses,
                user_history=user_history
            )
            
            if "error" in mcp_result:
                logger.warning(f"MCP server error: {mcp_result['error']}. Falling back to basic scoring.")
                return await _fallback_assessment(submission, assessment_id, user_history)
            
            logger.info(f"MCP analysis completed successfully for user {submission.user_id}")
            
            # Extract AI-generated results
            overall_score = mcp_result.get("maturity_score", 0)
            maturity_level = mcp_result.get("maturity_level", "Novice") 
            category_scores = mcp_result.get("dimensional_scores", {})
            strengths = mcp_result.get("strengths", [])
            improvement_areas = mcp_result.get("improvement_areas", [])
            ai_recommendations = mcp_result.get("recommendations", [])
            
            # Generate DORA metrics using AI insights
            dora_metrics_prediction = mcp_result.get("dora_prediction", {
                "deployment_frequency": "Monthly",
                "lead_time": "1-2 weeks", 
                "mttr": "1-4 hours",
                "change_failure_rate": "10-15%"
            })
            
            # Store assessment in database with new connection
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Insert assessment with MCP analysis
            cursor.execute('''
            INSERT INTO devops_assessments 
            (assessment_id, user_id, overall_score, maturity_level, category_scores, 
             strengths, improvement_areas, ai_recommendations, dora_metrics_prediction, 
             responses, mcp_analysis)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                assessment_id,
                submission.user_id,
                overall_score,
                maturity_level,
                json.dumps(category_scores),
                json.dumps(strengths),
                json.dumps(improvement_areas),
                json.dumps(ai_recommendations),
                json.dumps(dora_metrics_prediction),
                json.dumps(submission.responses),
                json.dumps(mcp_result)
            ))
            
            conn.commit()
            conn.close()  # Close after inserting
            
        except Exception as db_error:
            logger.error(f"Database error during assessment: {db_error}")
            # Fallback to basic assessment if database fails
            return await _fallback_assessment(submission, assessment_id, user_history)
        
        logger.info(f"Assessment {assessment_id} stored successfully for user {submission.user_id}")
        
        return {
            "assessment_id": assessment_id,
            "overall_score": round(overall_score, 1),
            "maturity_level": maturity_level,
            "category_scores": category_scores,
            "strengths": strengths,
            "improvement_areas": improvement_areas,
            "ai_recommendations": ai_recommendations,
            "dora_metrics_prediction": dora_metrics_prediction,
            "next_steps": mcp_result.get("next_steps", []),
            "transformation_timeline": mcp_result.get("estimated_transformation_time", "3-6 months"),
            "message": "✨ AI-powered assessment completed using MCP + Gemini",
            "mcp_powered": True,
            "improvement_trend": _calculate_improvement_trend(user_history, overall_score)
        }
        
    except Exception as e:
        logger.error(f"Assessment submission failed: {e}")
        raise HTTPException(status_code=500, detail=f"Assessment submission failed: {str(e)}")

async def _fallback_assessment(submission: AssessmentSubmission, assessment_id: str, user_history: List[Dict]):
    """Fallback assessment when MCP server is unavailable"""
    logger.info("Using fallback assessment method")
    
    # Basic scoring logic as fallback
    category_scores = {
        "Collaboration": 0,
        "Automation": 0, 
        "Monitoring": 0,
        "Culture": 0,
        "Delivery": 0
    }
    
    question_categories = {
        "collaboration_tools": "Collaboration",
        "cross_team_communication": "Collaboration",
        "shared_responsibilities": "Collaboration", 
        "ci_cd_pipeline": "Automation",
        "infrastructure_automation": "Automation",
        "automated_testing": "Automation",
        "monitoring_alerting": "Monitoring",
        "observability": "Monitoring", 
        "incident_response": "Monitoring",
        "psychological_safety": "Culture",
        "continuous_learning": "Culture",
        "failure_learning": "Culture",
        "deployment_frequency": "Delivery",
        "lead_time": "Delivery",
        "customer_feedback": "Delivery"
    }
    
    category_counts = {cat: 0 for cat in category_scores.keys()}
    
    for question, value in submission.responses.items():
        if question in question_categories:
            category = question_categories[question] 
            # Proper 1-5 to percentage conversion
            category_scores[category] += (value - 1) * 25  # Convert to 0-100 scale
            category_counts[category] += 1
    
    # Average the scores properly
    for category in category_scores:
        if category_counts[category] > 0:
            category_scores[category] = category_scores[category] / category_counts[category]
    
    overall_score = sum(category_scores.values()) / len(category_scores)
    
    # Determine maturity level with proper thresholds
    if overall_score >= 85:
        maturity_level = "Expert"
    elif overall_score >= 70:
        maturity_level = "Advanced"
    elif overall_score >= 55:
        maturity_level = "Intermediate"
    elif overall_score >= 35:
        maturity_level = "Developing"
    else:
        maturity_level = "Novice"
    
    # Store fallback results in database
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Basic recommendations for fallback
        strengths = ["Team collaboration", "Basic automation"]
        improvement_areas = ["Advanced monitoring", "Cultural transformation"]
        ai_recommendations = ["Implement CI/CD pipeline", "Enhance team communication"]
        dora_metrics_prediction = {
            "deployment_frequency": "Weekly",
            "lead_time": "1-2 days",
            "mttr": "2-4 hours", 
            "change_failure_rate": "5-10%"
        }
        
        cursor.execute('''
        INSERT INTO devops_assessments 
        (assessment_id, user_id, overall_score, maturity_level, category_scores, 
         strengths, improvement_areas, ai_recommendations, dora_metrics_prediction, 
         responses, mcp_analysis)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            assessment_id,
            submission.user_id,
            overall_score,
            maturity_level,
            json.dumps(category_scores),
            json.dumps(strengths),
            json.dumps(improvement_areas),
            json.dumps(ai_recommendations),
            json.dumps(dora_metrics_prediction),
            json.dumps(submission.responses),
            json.dumps({"fallback_mode": True, "error": "MCP server unavailable"})
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Fallback assessment {assessment_id} stored successfully for user {submission.user_id}")
        
    except Exception as fallback_db_error:
        logger.error(f"Database error in fallback assessment: {fallback_db_error}")
    
    return {
        "assessment_id": assessment_id,
        "overall_score": round(overall_score, 1),
        "maturity_level": maturity_level,
        "category_scores": category_scores,
        "strengths": strengths,
        "improvement_areas": improvement_areas,
        "ai_recommendations": ai_recommendations,
        "dora_metrics_prediction": dora_metrics_prediction,
        "message": "Assessment completed (fallback mode)",
        "mcp_powered": False,
        "improvement_trend": _calculate_improvement_trend(user_history, overall_score)
    }

def _calculate_improvement_trend(user_history: List[Dict], current_score: float) -> Dict[str, Any]:
    """Calculate improvement trend based on user history"""
    if not user_history:
        return {"trend": "baseline", "message": "First assessment - establishing baseline"}
    
    last_score = user_history[0].get("overall_score", 0)
    improvement = current_score - last_score
    
    if improvement > 5:
        return {
            "trend": "improving", 
            "improvement_points": round(improvement, 1),
            "message": f"Great progress! You've improved by {improvement:.1f} points"
        }
    elif improvement < -5:
        return {
            "trend": "declining",
            "improvement_points": round(improvement, 1), 
            "message": f"Score decreased by {abs(improvement):.1f} points - let's focus on improvement areas"
        }
    else:
        return {
            "trend": "stable",
            "improvement_points": round(improvement, 1),
            "message": "Maintaining steady progress - consistency is key"
        }

@router.get("/assessment-results/{assessment_id}")
async def get_assessment_results(assessment_id: str):
    """Get assessment results by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM devops_assessments WHERE assessment_id = ?
        ''', (assessment_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Parse JSON fields
        return {
            "assessment_id": result[0],
            "user_id": result[1],
            "overall_score": result[2],
            "maturity_level": result[3],
            "category_scores": json.loads(result[4]) if result[4] else {},
            "strengths": json.loads(result[5]) if result[5] else [],
            "improvement_areas": json.loads(result[6]) if result[6] else [],
            "ai_recommendations": json.loads(result[7]) if result[7] else [],
            "dora_metrics_prediction": json.loads(result[8]) if result[8] else {},
            "responses": json.loads(result[9]) if result[9] else {},
            "created_at": result[10]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve assessment: {str(e)}")

@router.get("/user-assessments/{user_id}")
async def get_user_assessments(user_id: str):
    """Get all assessments for a specific user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT assessment_id, overall_score, maturity_level, category_scores, created_at
        FROM devops_assessments 
        WHERE user_id = ?
        ORDER BY created_at DESC
        ''', (user_id,))
        
        results = cursor.fetchall()
        conn.close()
        
        assessments = []
        for result in results:
            assessments.append({
                "assessment_id": result[0],
                "overall_score": result[1],
                "maturity_level": result[2],
                "category_scores": json.loads(result[3]) if result[3] else {},
                "created_at": result[4]
            })
        
        # Calculate stats
        if assessments:
            total_assessments = len(assessments)
            latest = assessments[0]
            latest_score = latest["overall_score"]
            latest_maturity = latest["maturity_level"]
            
            # Calculate improvement (compare latest with previous)
            improvement = 0
            if len(assessments) > 1:
                previous_score = assessments[1]["overall_score"]
                improvement = latest_score - previous_score
            
            # Find strongest category
            strongest_category = "Culture"
            if latest["category_scores"]:
                strongest_category = max(latest["category_scores"], key=latest["category_scores"].get)
            
            return {
                "user_id": user_id,
                "total_assessments": total_assessments,
                "latest_score": round(latest_score, 1),
                "latest_maturity": latest_maturity,
                "improvement": round(improvement, 1),
                "strongest_category": strongest_category,
                "assessment_history": assessments[:5]  # Last 5 assessments
            }
        else:
            return {
                "user_id": user_id,
                "total_assessments": 0,
                "latest_score": 0,
                "latest_maturity": "Not Assessed",
                "improvement": 0,
                "strongest_category": "None",
                "assessment_history": []
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve user assessments: {str(e)}")

@router.get("/generate-questions/{user_id}")
async def generate_personalized_questions(user_id: str):
    """
    🤖 Generate AI-powered personalized DevOps questions based on user history
    """
    try:
        logger.info(f"Generating personalized questions for user: {user_id}")
        
        # Get user's assessment history
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT overall_score, maturity_level, category_scores, created_at
        FROM devops_assessments 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 3
        ''', (user_id,))
        
        user_history = []
        current_level = "intermediate"  # default
        
        for row in cursor.fetchall():
            assessment = {
                "overall_score": row[0],
                "maturity_level": row[1],
                "category_scores": json.loads(row[2]) if row[2] else {},
                "created_at": row[3]
            }
            user_history.append(assessment)
            
        if user_history:
            current_level = user_history[0]["maturity_level"].lower()
        
        conn.close()
        
        # Call MCP server for AI-generated questions
        questions_result = await mcp_client.generate_personalized_questions(
            user_id=user_id,
            user_history=user_history,
            current_level=current_level
        )
        
        if not questions_result:
            # Fallback to hardcoded questions if MCP fails
            questions_result = _generate_fallback_questions(current_level, user_history)
        
        logger.info(f"Generated {len(questions_result)} personalized questions for {user_id}")
        
        return {
            "user_id": user_id,
            "current_level": current_level,
            "question_count": len(questions_result),
            "questions": questions_result,
            "personalized": True,
            "based_on_history": len(user_history) > 0,
            "message": "✨ AI-generated personalized questions based on your DevOps journey"
        }
        
    except Exception as e:
        logger.error(f"Failed to generate personalized questions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")

def _generate_fallback_questions(level: str, history: List[Dict]) -> List[Dict]:
    """Generate fallback questions when MCP is unavailable"""
    
    # Analyze weak areas from history
    weak_areas = []
    if history:
        latest = history[0]
        category_scores = latest.get("category_scores", {})
        for category, score in category_scores.items():
            if score < 60:  # Below 60% needs improvement
                weak_areas.append(category.lower())
    
    # Level-appropriate questions with focus on weak areas
    base_questions = {
        "novice": [
            {
                "id": "collab_basic_1",
                "category": "Collaboration",
                "question": "How often do team members communicate about their work?",
                "options": ["Rarely", "Weekly meetings only", "Daily check-ins", "Frequent informal communication", "Continuous collaboration"],
                "weight": 1.0,
                "type": "multiple"
            },
            {
                "id": "auto_basic_1", 
                "category": "Automation",
                "question": "What level of build automation does your team have?",
                "options": ["Manual builds", "Some build scripts", "Automated builds", "Automated builds with testing", "Full CI/CD pipeline"],
                "weight": 1.0,
                "type": "multiple"
            }
        ],
        "intermediate": [
            {
                "id": "culture_int_1",
                "category": "Culture", 
                "question": "How does your team approach continuous improvement?",
                "options": ["No formal process", "Occasional retrospectives", "Regular retrospectives", "Continuous improvement mindset", "Innovation-driven culture"],
                "weight": 0.9,
                "type": "multiple"
            },
            {
                "id": "monitor_int_1",
                "category": "Monitoring",
                "question": "Rate your team's observability practices (1-10)",
                "weight": 0.8,
                "type": "rating"
            }
        ],
        "advanced": [
            {
                "id": "delivery_adv_1",
                "category": "Delivery",
                "question": "How does your team handle feature flags and deployment strategies?",
                "options": ["No feature flags", "Basic feature toggles", "Comprehensive feature management", "Advanced deployment strategies", "Sophisticated canary/blue-green deployments"],
                "weight": 0.9,
                "type": "multiple"
            }
        ]
    }
    
    questions = base_questions.get(level, base_questions["intermediate"])
    
    # Add focused questions for weak areas
    if "collaboration" in weak_areas:
        questions.append({
            "id": "collab_focused_1",
            "category": "Collaboration", 
            "question": "How effectively do development and operations teams work together?",
            "options": ["Separate silos", "Basic handoffs", "Some collaboration", "Strong partnership", "Fully integrated teams"],
            "weight": 1.0,
            "type": "multiple",
            "focused": True
        })
    
    return questions[:15]  # Limit to 15 questions

@router.get("/ai-guidance/{user_id}")
async def ai_personalized_devops_guidance(
    user_id: str, 
    focus_area: Optional[str] = None,
    learning_style: Optional[str] = "comprehensive"
):
    """
    🧭 AI-Powered Personalized DevOps Guidance
    Navigate individual DevOps journey with AI-powered recommendations
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get comprehensive user context
        cursor.execute("""
        SELECT id, name, role, github_username, email, created_at,
               (SELECT COUNT(*) FROM team_members WHERE user_id = users.id) as project_count
        FROM users WHERE id = ?
        """, (user_id,))
        
        user_info = cursor.fetchone()
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's current projects and roles
        cursor.execute("""
        SELECT p.id, p.name, p.description, tm.role as project_role,
               p.status, p.priority, tm.joined_at
        FROM projects p
        JOIN team_members tm ON p.id = tm.project_id
        WHERE tm.user_id = ? AND tm.status = 'active'
        ORDER BY tm.joined_at DESC
        """, (user_id,))
        
        user_projects = cursor.fetchall()
        
        # Get recent culture assessments for user's teams
        cursor.execute("""
        SELECT ca.team_id, ca.maturity_score, ca.ai_analysis, ca.created_at,
               p.name as project_name
        FROM culture_assessments ca
        JOIN projects p ON ca.team_id = p.id
        JOIN team_members tm ON ca.team_id = tm.project_id
        WHERE tm.user_id = ? AND ca.assessment_type = 'ai_powered_mcp'
        ORDER BY ca.created_at DESC
        LIMIT 5
        """, (user_id,))
        
        recent_assessments = cursor.fetchall()
        
        # Get user's skill development history (if exists)
        cursor.execute("""
        SELECT skill_area, current_level, target_level, last_updated
        FROM user_skills WHERE user_id = ?
        ORDER BY last_updated DESC
        """, (user_id,))
        
        user_skills = cursor.fetchall()
        conn.close()
        
        # Prepare comprehensive context for AI guidance
        guidance_context = {
            "user": {
                "id": user_info[0],
                "name": user_info[1],
                "role": user_info[2],
                "github_username": user_info[3],
                "email": user_info[4],
                "account_age": calculate_account_age(user_info[5]),
                "project_count": user_info[6],
                "experience_level": determine_user_experience_level(user_info[2], user_info[5])
            },
            "current_projects": [
                {
                    "id": proj[0],
                    "name": proj[1],
                    "description": proj[2],
                    "user_role": proj[3],
                    "status": proj[4],
                    "priority": proj[5],
                    "involvement_duration": calculate_involvement_duration(proj[6])
                } for proj in user_projects
            ],
            "team_assessments": [
                {
                    "team_id": assess[0],
                    "maturity_score": assess[1],
                    "ai_insights": json.loads(assess[2]) if assess[2] else {},
                    "assessment_date": assess[3],
                    "project_name": assess[4]
                } for assess in recent_assessments
            ],
            "skill_profile": [
                {
                    "area": skill[0],
                    "current_level": skill[1],
                    "target_level": skill[2],
                    "progress": calculate_skill_progress(skill[1], skill[2])
                } for skill in user_skills
            ],
            "focus_area": focus_area,
            "learning_style": learning_style,
            "guidance_timestamp": datetime.now().isoformat()
        }
        
        # Call MCP/Gemini for personalized guidance
        guidance_result = await call_mcp_for_personalized_guidance(guidance_context)
        
        return {
            "🧭 user_profile": guidance_context["user"],
            "🎯 personalized_guidance": guidance_result,
            "📚 learning_path": guidance_result.get('learning_path', []),
            "⚡ action_items": guidance_result.get('action_items', []),
            "🔧 recommended_tools": guidance_result.get('recommended_tools', []),
            "📈 skill_development": guidance_result.get('skill_priorities', []),
            "🏆 career_advancement": guidance_result.get('career_suggestions', []),
            "📖 resources": guidance_result.get('resources', []),
            "⏳ estimated_timeline": guidance_result.get('estimated_timeline', '3-6 months'),
            "🤖 ai_insights": guidance_result.get('ai_insights', 'Guidance generated successfully'),
            "powered_by": "🧭 Meridian MCP + Gemini AI"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI guidance generation failed: {str(e)}")

class AIGuidanceRequest(BaseModel):
    assessment_id: str
    guidance_type: str = "comprehensive"
    focus_areas: List[str] = []

@router.post("/ai-guidance")
async def generate_ai_guidance(request: AIGuidanceRequest):
    """Generate AI-powered DevOps guidance based on assessment"""
    try:
        # Get assessment data
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM devops_assessments WHERE assessment_id = ?
        ''', (request.assessment_id,))
        
        assessment = cursor.fetchone()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Parse assessment data
        category_scores = json.loads(assessment[4]) if assessment[4] else {}
        responses = json.loads(assessment[9]) if assessment[9] else {}
        
        # Generate guidance based on assessment
        guidance = {
            "learning_path": [
                {
                    "module": "Foundation",
                    "title": "DevOps Culture Fundamentals",
                    "estimated_time": "2 weeks",
                    "priority": "high"
                },
                {
                    "module": "Collaboration", 
                    "title": "Cross-functional Team Collaboration",
                    "estimated_time": "3 weeks",
                    "priority": "medium" if category_scores.get("Collaboration", 0) > 60 else "high"
                },
                {
                    "module": "Automation",
                    "title": "CI/CD Pipeline Implementation", 
                    "estimated_time": "4 weeks",
                    "priority": "medium" if category_scores.get("Automation", 0) > 60 else "high"
                }
            ],
            "immediate_actions": [
                "Set up daily standup meetings for better communication",
                "Implement basic CI/CD pipeline for main applications",
                "Establish monitoring and alerting for critical services",
                "Create incident response runbooks and procedures"
            ]
        }
        
        conn.close()
        
        return {
            "assessment_id": request.assessment_id,
            "guidance_type": request.guidance_type,
            "learning_path": guidance["learning_path"],
            "immediate_actions": guidance["immediate_actions"],
            "focus_areas": request.focus_areas,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI guidance generation failed: {str(e)}")

class RoadmapRequest(BaseModel):
    assessment_id: str
    target_maturity: str = "Expert"
    timeline_months: int = 12
    focus_areas: List[str] = []

class PersonalizedQuestionsRequest(BaseModel):
    user_id: str
    current_skill_level: str = "intermediate"
    focus_areas: List[str] = []

@router.post("/generate-roadmap")
async def generate_transformation_roadmap(request: RoadmapRequest):
    """Generate transformation roadmap based on assessment"""
    try:
        # Get assessment data
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM devops_assessments WHERE assessment_id = ?
        ''', (request.assessment_id,))
        
        assessment = cursor.fetchone()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        current_maturity = assessment[3]
        category_scores = json.loads(assessment[4]) if assessment[4] else {}
        
        # Generate roadmap phases
        phases = [
            {
                "phase": "Foundation Building",
                "duration": "2-3 months",
                "focus_areas": ["Team Formation", "Basic Tooling", "Process Definition"],
                "key_activities": [
                    "Establish cross-functional teams",
                    "Set up basic CI/CD pipeline",
                    "Define deployment processes",
                    "Implement basic monitoring"
                ],
                "success_metrics": [
                    "Team velocity improvement",
                    "Reduced manual deployments",
                    "Faster incident detection"
                ],
                "tools_technologies": ["Git", "Jenkins/GitHub Actions", "Docker", "Basic Monitoring"]
            },
            {
                "phase": "Automation Excellence",
                "duration": "3-4 months", 
                "focus_areas": ["Infrastructure as Code", "Test Automation", "Deployment Automation"],
                "key_activities": [
                    "Implement Infrastructure as Code",
                    "Expand automated testing",
                    "Set up deployment pipelines",
                    "Implement comprehensive monitoring"
                ],
                "success_metrics": [
                    "Infrastructure provisioning time",
                    "Test coverage percentage",
                    "Deployment frequency"
                ],
                "tools_technologies": ["Terraform", "Kubernetes", "Prometheus", "Grafana"]
            }
        ]
        
        # Generate roadmap ID and store
        roadmap_id = str(uuid.uuid4())
        
        # Create roadmaps table if not exists
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS transformation_roadmaps (
            roadmap_id TEXT PRIMARY KEY,
            assessment_id TEXT,
            current_maturity TEXT,
            target_maturity TEXT,
            estimated_duration TEXT,
            phases TEXT,
            quick_wins TEXT,
            critical_success_factors TEXT,
            risk_mitigation TEXT,
            resource_requirements TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        quick_wins = [
            "Implement daily standups for better communication",
            "Set up automated deployment for staging environment",
            "Create shared documentation repository",
            "Establish incident response procedures"
        ]
        
        critical_success_factors = [
            "Leadership commitment and support",
            "Team willingness to learn and adapt",
            "Adequate time allocation for transformation",
            "Clear communication of benefits and goals"
        ]
        
        risk_mitigation = [
            "Gradual implementation to minimize disruption",
            "Regular training and skill development",
            "Backup procedures for critical systems",
            "Clear rollback strategies for changes"
        ]
        
        resource_requirements = [
            "DevOps engineer or consultant for guidance",
            "Training budget for team skill development",
            "Tool licensing and infrastructure costs",
            "Time allocation (20% of team capacity)"
        ]
        
        # Insert roadmap
        cursor.execute('''
        INSERT INTO transformation_roadmaps 
        (roadmap_id, assessment_id, current_maturity, target_maturity, estimated_duration,
         phases, quick_wins, critical_success_factors, risk_mitigation, resource_requirements)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            roadmap_id,
            request.assessment_id,
            current_maturity,
            request.target_maturity,
            f"{request.timeline_months} months",
            json.dumps(phases),
            json.dumps(quick_wins),
            json.dumps(critical_success_factors),
            json.dumps(risk_mitigation),
            json.dumps(resource_requirements)
        ))
        
        conn.commit()
        conn.close()
        
        return {
            "roadmap_id": roadmap_id,
            "assessment_id": request.assessment_id,
            "current_maturity": current_maturity,
            "target_maturity": request.target_maturity,
            "estimated_duration": f"{request.timeline_months} months",
            "phases": phases,
            "quick_wins": quick_wins,
            "critical_success_factors": critical_success_factors,
            "risk_mitigation": risk_mitigation,
            "resource_requirements": resource_requirements
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")

@router.get("/transformation-roadmap/{assessment_id}")
async def get_transformation_roadmap(assessment_id: str):
    """Get transformation roadmap by assessment ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT * FROM transformation_roadmaps WHERE assessment_id = ?
        ORDER BY created_at DESC LIMIT 1
        ''', (assessment_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        
        return {
            "roadmap_id": result[0],
            "assessment_id": result[1], 
            "current_maturity": result[2],
            "target_maturity": result[3],
            "estimated_duration": result[4],
            "phases": json.loads(result[5]) if result[5] else [],
            "quick_wins": json.loads(result[6]) if result[6] else [],
            "critical_success_factors": json.loads(result[7]) if result[7] else [],
            "risk_mitigation": json.loads(result[8]) if result[8] else [],
            "resource_requirements": json.loads(result[9]) if result[9] else [],
            "created_at": result[10]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve roadmap: {str(e)}")

@router.post("/generate-personalized-questions")
async def generate_personalized_questions(request: PersonalizedQuestionsRequest):
    """Generate personalized assessment questions based on user history and skill level"""
    try:
        # Get user's assessment history
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT assessment_id, overall_score, maturity_level, category_scores, 
               mcp_analysis, created_at
        FROM devops_assessments 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 3
        ''', (request.user_id,))
        
        user_history = []
        for row in cursor.fetchall():
            user_history.append({
                "assessment_id": row[0],
                "overall_score": row[1],
                "maturity_level": row[2], 
                "category_scores": json.loads(row[3]) if row[3] else {},
                "mcp_analysis": json.loads(row[4]) if row[4] else {},
                "created_at": row[5]
            })
        
        conn.close()
        
        # Call MCP server for personalized question generation
        try:
            personalized_result = await mcp_client.generate_personalized_questions(
                user_id=request.user_id,
                skill_level=request.current_skill_level,
                user_history=user_history,
                focus_areas=request.focus_areas
            )
            
            if "error" in personalized_result:
                logger.warning(f"MCP server error for personalized questions: {personalized_result['error']}")
                # Return default questions as fallback
                return _get_default_questions(request.current_skill_level)
            
            return {
                "questions": personalized_result.get("questions", []),
                "difficulty_level": personalized_result.get("difficulty_level", request.current_skill_level),
                "focus_areas": personalized_result.get("recommended_focus_areas", []),
                "personalized": True,
                "based_on_history": len(user_history) > 0,
                "message": f"Questions personalized based on {len(user_history)} previous assessments"
            }
            
        except Exception as mcp_error:
            logger.error(f"MCP client error for personalized questions: {mcp_error}")
            return _get_default_questions(request.current_skill_level)
        
    except Exception as e:
        logger.error(f"Error generating personalized questions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate personalized questions: {str(e)}")

def _get_default_questions(skill_level: str) -> Dict[str, Any]:
    """Fallback default questions when MCP is unavailable"""
    default_questions = [
        {
            "id": "collaboration_tools",
            "question": "How effectively does your team use collaboration tools?",
            "category": "Collaboration",
            "options": ["Poor", "Fair", "Good", "Very Good", "Excellent"]
        },
        {
            "id": "ci_cd_pipeline", 
            "question": "How mature is your CI/CD pipeline?",
            "category": "Automation",
            "options": ["No Pipeline", "Basic", "Intermediate", "Advanced", "Expert"]
        },
        {
            "id": "monitoring_alerting",
            "question": "How comprehensive is your monitoring and alerting?",
            "category": "Monitoring", 
            "options": ["None", "Basic", "Moderate", "Comprehensive", "Advanced"]
        }
    ]
    
    return {
        "questions": default_questions,
        "difficulty_level": skill_level,
        "focus_areas": ["collaboration", "automation", "monitoring"],
        "personalized": False,
        "based_on_history": False,
        "message": "Using default questions (MCP unavailable)"
    }

@router.get("/culture-dashboard/{manager_id}")
async def devops_culture_dashboard(manager_id: str):
    """
    📊 DevOps Culture Dashboard for Managers
    Comprehensive view of team culture maturity across all projects
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get manager's projects with culture data
        cursor.execute("""
        SELECT p.id, p.name, p.description, p.status, p.priority,
               COUNT(tm.user_id) as team_size,
               ca.maturity_score, ca.assessment_data, ca.created_at as last_assessment,
               AVG(pm.metric_value) as avg_performance
        FROM projects p
        LEFT JOIN team_members tm ON p.id = tm.project_id
        LEFT JOIN culture_assessments ca ON p.id = ca.team_id
        LEFT JOIN project_metrics pm ON p.id = pm.project_id
        WHERE p.manager_id = ?
        GROUP BY p.id
        ORDER BY p.created_at DESC
        """, (manager_id,))
        
        projects_culture = cursor.fetchall()
        
        # Get organization-wide culture trends
        cursor.execute("""
        SELECT DATE(ca.created_at) as assessment_date, AVG(ca.maturity_score) as avg_maturity
        FROM culture_assessments ca
        JOIN projects p ON ca.team_id = p.id
        WHERE p.manager_id = ? AND ca.created_at >= date('now', '-90 days')
        GROUP BY DATE(ca.created_at)
        ORDER BY assessment_date
        """, (manager_id,))
        
        culture_trends = cursor.fetchall()
        conn.close()
        
        # Calculate culture health metrics
        culture_overview = {
            "total_teams": len(projects_culture),
            "assessed_teams": sum(1 for p in projects_culture if p[6] is not None),
            "avg_maturity_score": calculate_avg_maturity(projects_culture),
            "culture_trend": calculate_culture_trend(culture_trends),
            "teams_needing_attention": identify_teams_needing_attention(projects_culture),
            "culture_champions": identify_culture_champions(projects_culture)
        }
        
        return {
            "🏗️ manager_overview": culture_overview,
            "📊 projects_culture": [
                {
                    "project_id": p[0],
                    "project_name": p[1],
                    "team_size": p[5],
                    "maturity_score": p[6] or 0,
                    "last_assessment": p[8],
                    "status": determine_culture_status(p[6]),
                    "priority": p[4],
                    "avg_performance": p[9] or 0
                } for p in projects_culture
            ],
            "📈 culture_trends": [
                {
                    "date": trend[0],
                    "avg_maturity": trend[1]
                } for trend in culture_trends
            ],
            "💡 insights": generate_manager_culture_insights(culture_overview, projects_culture),
            "🎯 recommendations": generate_manager_recommendations(culture_overview, projects_culture),
            "powered_by": "🧭 Meridian DevOps Culture Intelligence"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Culture dashboard failed: {str(e)}")

# Helper functions for AI MCP integration

async def call_mcp_for_culture_assessment(context: Dict[str, Any]) -> Dict[str, Any]:
    """Call MCP server for AI-powered culture assessment"""
    try:
        # Direct integration with MCP tools
        import sys
        import os
        sys.path.append('/Users/arnabmaity/Documents/Meridian/mcp-server')
        
        from devops_culture_tools import devops_culture_assessment
        import google.generativeai as genai
        
        # Configure Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        else:
            gemini_model = None
        
        # Call the AI assessment
        result = await devops_culture_assessment(
            assessment_context=context,
            analysis_type="comprehensive",
            gemini_model=gemini_model
        )
        
        return result
                
    except Exception as e:
        print(f"🚨 MCP assessment call failed: {e}")
        return generate_enhanced_fallback_assessment(context)

async def call_mcp_for_personalized_guidance(context: Dict[str, Any]) -> Dict[str, Any]:
    """Call MCP server for AI-powered personalized guidance"""
    try:
        # Direct integration with MCP tools
        import sys
        import os
        sys.path.append('/Users/arnabmaity/Documents/Meridian/mcp-server')
        
        from devops_culture_tools import personalized_devops_guidance
        import google.generativeai as genai
        
        # Configure Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        else:
            gemini_model = None
        
        # Call the AI guidance
        result = await personalized_devops_guidance(
            user_context=context,
            guidance_type="comprehensive",
            gemini_model=gemini_model
        )
        
        return result
                
    except Exception as e:
        print(f"🚨 MCP guidance call failed: {e}")
        return generate_enhanced_fallback_guidance(context)

def generate_enhanced_fallback_assessment(context: Dict[str, Any]) -> Dict[str, Any]:
    """Enhanced fallback assessment with better intelligence"""
    team_info = context.get('team_info', {})
    team_size = team_info.get('team_size', 1)
    roles = team_info.get('roles_distribution', [])
    
    # Intelligence-based scoring
    base_score = 45  # Starting point
    
    # Team size factor
    if team_size >= 5:
        base_score += 15
    elif team_size >= 3:
        base_score += 10
    
    # Role diversity factor
    unique_roles = len(set(roles))
    if unique_roles >= 4:
        base_score += 20
    elif unique_roles >= 2:
        base_score += 10
    
    return {
        "assessment_id": f"fallback_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "team_name": team_info.get('name', 'Unknown Team'),
        "maturity_score": min(85, base_score),
        "maturity_level": "Developing" if base_score < 60 else "Defined",
        "dimensional_scores": {
            "collaboration": min(5, 2 + unique_roles),
            "automation": 2 + (1 if team_size >= 3 else 0),
            "monitoring": 2,
            "culture": 2 + (1 if unique_roles >= 3 else 0),
            "delivery": 2
        },
        "strengths": [
            "🤝 Active team structure in place",
            "📊 Structured project management approach",
            f"👥 {team_size}-person team showing collaboration potential"
        ],
        "improvement_areas": [
            "🔧 Enhance automation practices",
            "📈 Strengthen monitoring and observability",
            "🚀 Improve deployment frequency"
        ],
        "recommendations": [
            {
                "area": "🔄 CI/CD Pipeline Development",
                "priority": "High",
                "action": "Establish automated build and deployment pipeline",
                "timeline": "3-4 weeks",
                "impact": "🎯 Faster, more reliable deployments"
            },
            {
                "area": "📊 Monitoring Implementation",
                "priority": "Medium",
                "action": "Set up application and infrastructure monitoring",
                "timeline": "2 weeks",
                "impact": "👁️ Better system visibility and proactive issue detection"
            }
        ],
        "next_steps": [
            "🏁 Complete comprehensive team assessment",
            "🛠️ Identify first automation opportunity",
            "📐 Define success metrics for improvement"
        ],
        "estimated_transformation_time": "4-6 months for significant improvement"
    }

def generate_enhanced_fallback_guidance(context: Dict[str, Any]) -> Dict[str, Any]:
    """Enhanced fallback guidance with role-specific intelligence"""
    user = context.get('user', {})
    role = user.get('role', 'professional')
    experience = user.get('experience_level', 'intermediate')
    projects = context.get('current_projects', [])
    
    guidance_frameworks = {
        'manager': {
            'beginner': {
                "learning_path": [
                    "🎯 DevOps Leadership Fundamentals",
                    "📊 Team Performance Metrics & KPIs",
                    "🔄 Change Management for DevOps",
                    "🤝 Building Collaborative Culture"
                ],
                "timeline": "3-4 months"
            },
            'experienced': {
                "learning_path": [
                    "🚀 Advanced DevOps Strategy & Governance",
                    "📈 Scaling DevOps Across Organizations", 
                    "💰 ROI Measurement & Business Value",
                    "🎓 Executive DevOps Communication"
                ],
                "timeline": "2-3 months"
            }
        },
        'professional': {
            'beginner': {
                "learning_path": [
                    "🏗️ Infrastructure as Code Foundations",
                    "🔧 Basic CI/CD Pipeline Creation",
                    "📊 Monitoring & Logging Basics",
                    "🐳 Containerization with Docker"
                ],
                "timeline": "4-6 months"
            },
            'experienced': {
                "learning_path": [
                    "☸️ Advanced Kubernetes Orchestration",
                    "🔐 DevSecOps & Security Integration",
                    "☁️ Multi-Cloud & Hybrid Strategies",
                    "🤖 AI/ML in DevOps Operations"
                ],
                "timeline": "3-4 months"
            }
        }
    }
    
    user_guidance = guidance_frameworks.get(role, guidance_frameworks['professional']).get(experience, guidance_frameworks['professional']['beginner'])
    
    return {
        "personalized_message": f"🧭 Welcome {user.get('name', 'there')}! Your DevOps journey as a {role} is customized based on your {experience} level.",
        "guidance_type": "enhanced_fallback",
        "learning_path": user_guidance["learning_path"],
        "action_items": [
            "📝 Complete DevOps skills self-assessment",
            "🎯 Choose one technical area for deep focus",
            "🏗️ Set up personal learning lab environment",
            "👥 Join DevOps community discussions"
        ],
        "recommended_tools": get_role_specific_tools(role),
        "resources": [
            {"title": "The DevOps Handbook", "type": "📚 Book", "priority": "High"},
            {"title": "DevOps Institute Learning Paths", "type": "🎓 Certification", "priority": "Medium"},
            {"title": "Hands-on DevOps Labs", "type": "🔬 Practical", "priority": "High"}
        ],
        "estimated_timeline": user_guidance["timeline"],
        "success_metrics": generate_success_metrics_for_role(role, experience)
    }

# Additional helper functions

def calculate_experience_level(created_at: str) -> str:
    """Calculate user experience level based on account age"""
    try:
        account_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        age_days = (datetime.now() - account_date).days
        
        if age_days >= 730:  # 2+ years
            return "experienced"
        elif age_days >= 180:  # 6+ months
            return "intermediate"
        else:
            return "beginner"
    except:
        return "intermediate"

def calculate_account_age(created_at: str) -> str:
    """Calculate readable account age"""
    try:
        account_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        age_days = (datetime.now() - account_date).days
        
        if age_days >= 365:
            years = age_days // 365
            return f"{years} year{'s' if years > 1 else ''}"
        elif age_days >= 30:
            months = age_days // 30
            return f"{months} month{'s' if months > 1 else ''}"
        else:
            return f"{age_days} day{'s' if age_days != 1 else ''}"
    except:
        return "Unknown"

def determine_user_experience_level(role: str, created_at: str) -> str:
    """Determine user experience level from role and account age"""
    base_level = calculate_experience_level(created_at)
    
    # Adjust based on role
    if role == 'manager':
        return 'experienced' if base_level in ['intermediate', 'experienced'] else 'intermediate'
    
    return base_level

def calculate_involvement_duration(joined_at: str) -> str:
    """Calculate how long user has been involved in project"""
    try:
        join_date = datetime.fromisoformat(joined_at.replace('Z', '+00:00'))
        duration_days = (datetime.now() - join_date).days
        
        if duration_days >= 365:
            years = duration_days // 365
            return f"{years} year{'s' if years > 1 else ''}"
        elif duration_days >= 30:
            months = duration_days // 30
            return f"{months} month{'s' if months > 1 else ''}"
        else:
            return f"{duration_days} day{'s' if duration_days != 1 else ''}"
    except:
        return "Unknown"

def calculate_skill_progress(current_level: str, target_level: str) -> int:
    """Calculate skill progress percentage"""
    levels = {'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4}
    
    current = levels.get(current_level.lower(), 1)
    target = levels.get(target_level.lower(), 4)
    
    if target <= current:
        return 100
    
    return int((current / target) * 100)

def get_role_specific_tools(role: str) -> List[Dict[str, str]]:
    """Get recommended tools based on user role"""
    tools_map = {
        'manager': [
            {"name": "Jira/Azure DevOps", "category": "Project Management", "priority": "High"},
            {"name": "Grafana/DataDog", "category": "Metrics & Dashboards", "priority": "High"},
            {"name": "Slack/Teams", "category": "Communication", "priority": "Medium"}
        ],
        'professional': [
            {"name": "Terraform/Pulumi", "category": "Infrastructure as Code", "priority": "High"},
            {"name": "Jenkins/GitHub Actions", "category": "CI/CD", "priority": "High"},
            {"name": "Kubernetes", "category": "Orchestration", "priority": "Medium"},
            {"name": "Prometheus + Grafana", "category": "Monitoring", "priority": "High"}
        ]
    }
    
    return tools_map.get(role, tools_map['professional'])

def generate_success_metrics_for_role(role: str, experience: str) -> List[str]:
    """Generate success metrics based on role and experience"""
    base_metrics = [
        "📈 Complete 80% of learning path objectives",
        "🎯 Successfully implement 2-3 practical projects",
        "👥 Actively participate in DevOps community"
    ]
    
    if role == 'manager':
        base_metrics.extend([
            "📊 Improve team velocity metrics by 25%",
            "🎓 Complete DevOps leadership certification",
            "🤝 Establish team collaboration best practices"
        ])
    else:
        base_metrics.extend([
            "🔧 Build and maintain personal DevOps toolkit",
            "🏗️ Contribute to open-source DevOps projects",
            "🎯 Achieve relevant technical certifications"
        ])
    
    return base_metrics

def calculate_avg_maturity(projects_culture) -> float:
    """Calculate average maturity score across projects"""
    scores = [p[6] for p in projects_culture if p[6] is not None]
    return sum(scores) / len(scores) if scores else 0

def calculate_culture_trend(culture_trends) -> str:
    """Calculate culture trend direction"""
    if len(culture_trends) < 2:
        return "stable"
    
    recent_avg = sum(t[1] for t in culture_trends[-3:]) / min(3, len(culture_trends))
    older_avg = sum(t[1] for t in culture_trends[:3]) / min(3, len(culture_trends))
    
    if recent_avg > older_avg + 5:
        return "improving"
    elif recent_avg < older_avg - 5:
        return "declining"
    else:
        return "stable"

def identify_teams_needing_attention(projects_culture) -> List[str]:
    """Identify teams that need management attention"""
    attention_needed = []
    
    for project in projects_culture:
        if project[6] and project[6] < 40:  # Low maturity score
            attention_needed.append(project[1])  # Project name
    
    return attention_needed

def identify_culture_champions(projects_culture) -> List[str]:
    """Identify high-performing culture champion teams"""
    champions = []
    
    for project in projects_culture:
        if project[6] and project[6] >= 80:  # High maturity score
            champions.append(project[1])  # Project name
    
    return champions

def determine_culture_status(maturity_score) -> str:
    """Determine culture status from maturity score"""
    if not maturity_score:
        return "Not Assessed"
    elif maturity_score >= 80:
        return "Excellent"
    elif maturity_score >= 60:
        return "Good"
    elif maturity_score >= 40:
        return "Developing"
    else:
        return "Needs Attention"

def generate_manager_culture_insights(overview, projects_culture) -> List[str]:
    """Generate insights for managers based on culture data"""
    insights = []
    
    if overview["avg_maturity_score"] >= 70:
        insights.append("🎉 Your teams show strong DevOps culture maturity")
    elif overview["avg_maturity_score"] >= 50:
        insights.append("📈 Teams are developing good DevOps practices with room for growth")
    else:
        insights.append("🎯 Focus needed on fundamental DevOps culture building")
    
    if len(overview["teams_needing_attention"]) > 0:
        insights.append(f"⚠️ {len(overview['teams_needing_attention'])} team(s) need immediate attention")
    
    if len(overview["culture_champions"]) > 0:
        insights.append(f"🏆 {len(overview['culture_champions'])} team(s) are culture champions")
    
    return insights

def generate_manager_recommendations(overview, projects_culture) -> List[str]:
    """Generate recommendations for managers"""
    recommendations = []
    
    if overview["culture_trend"] == "declining":
        recommendations.append("🚨 Address declining culture trend with team interventions")
    
    if overview["assessed_teams"] < overview["total_teams"]:
        recommendations.append("📋 Complete culture assessments for all teams")
    
    if len(overview["teams_needing_attention"]) > 0:
        recommendations.append("🎯 Focus improvement efforts on underperforming teams")
    
    recommendations.append("💡 Schedule monthly culture check-ins with team leads")
    recommendations.append("🎓 Invest in DevOps training and certification programs")
    
    return recommendations
    
    overall_score = sum(overall_scores) // len(overall_scores) if overall_scores else 0
    
    # Determine maturity level
    if overall_score >= 80:
        maturity_level = "expert"
    elif overall_score >= 60:
        maturity_level = "advanced"
    elif overall_score >= 40:
        maturity_level = "intermediate"
    else:
        maturity_level = "beginner"
    
    # Calculate cultural health metrics
    cultural_health = {
        "collaboration": min(100, team_size * 15 + (overall_score // 2)),
        "automation": overall_score,
        "continuous_improvement": min(100, overall_score + 10),
        "psychological_safety": min(100, 70 + (team_size * 5)),
        "learning_culture": min(100, overall_score + 5),
        "innovation": min(100, overall_score - 10)
    }
    
    # Identify top improvement areas
    improvement_areas = [
        area for area, score in cultural_health.items() 
        if score < 70
    ]
    
    return {
        "team_size": team_size,
        "project_id": project_id,
        "assessment_date": datetime.now().isoformat(),
        "maturity_level": maturity_level,
        "overall_score": overall_score,
        "practices": practices_assessment,
        "cultural_health": cultural_health,
        "improvement_areas": improvement_areas,
        "team_composition": [{"name": member[1], "role": member[2]} for member in team_data]
    }

def calculate_practice_adoption(practice, team_data, project_metrics):
    """Calculate adoption level for a specific DevOps practice"""
    base_score = 30  # Base score
    
    # Role-based scoring
    role_bonus = 0
    for member in team_data:
        role = member[2].lower()
        if "devops" in role or "sre" in role:
            role_bonus += 20
        elif "senior" in role or "lead" in role:
            role_bonus += 15
        elif "developer" in role:
            role_bonus += 10
    
    # Practice-specific adjustments
    practice_lower = practice.lower()
    if "test" in practice_lower and "velocity" in project_metrics:
        base_score += min(30, int(project_metrics["velocity"]["value"]))
    elif "monitor" in practice_lower and "uptime" in project_metrics:
        base_score += 25
    elif "automation" in practice_lower:
        base_score += role_bonus // 2
    
    return min(100, base_score + (role_bonus // len(team_data)) if team_data else base_score)

def determine_practice_importance(practice, team_data):
    """Determine the importance level of a practice for the team"""
    team_size = len(team_data)
    
    critical_practices = ["Automated Testing", "Code Reviews", "Incident Response", "Application Monitoring"]
    high_practices = ["Code Integration", "Daily Standups", "Infrastructure as Code", "Alerting"]
    
    if practice in critical_practices:
        return "critical"
    elif practice in high_practices or team_size > 5:
        return "high"
    else:
        return "medium"

def get_current_tools(practice, project_metrics):
    """Get current tools being used for a practice"""
    tool_mapping = {
        "Automated Testing": ["Jest", "pytest", "JUnit"],
        "Code Integration": ["Git", "GitHub Actions", "Jenkins"],
        "Deployment Automation": ["Docker", "Kubernetes", "Terraform"],
        "Application Monitoring": ["Prometheus", "Grafana", "New Relic"],
        "Infrastructure as Code": ["Terraform", "CloudFormation", "Ansible"]
    }
    
    return tool_mapping.get(practice, ["To be identified"])

def identify_gaps(practice, adoption_level):
    """Identify gaps in practice adoption"""
    if adoption_level < 30:
        return [f"No {practice} implementation", "Lack of tooling", "No established process"]
    elif adoption_level < 60:
        return [f"Partial {practice} adoption", "Inconsistent implementation", "Limited automation"]
    elif adoption_level < 80:
        return [f"Good {practice} but needs optimization", "Could be more automated"]
    else:
        return ["Minor optimizations possible"]

def get_practice_recommendations(practice, adoption_level):
    """Get AI-generated recommendations for improving practice adoption"""
    if adoption_level < 30:
        return [
            f"Start implementing basic {practice}",
            "Invest in training and tooling",
            "Create initial processes and guidelines"
        ]
    elif adoption_level < 60:
        return [
            f"Enhance {practice} implementation",
            "Increase automation levels",
            "Standardize processes across team"
        ]
    elif adoption_level < 80:
        return [
            f"Optimize {practice} for better efficiency",
            "Add advanced features and monitoring",
            "Share best practices with other teams"
        ]
    else:
        return [
            f"Maintain excellence in {practice}",
            "Mentor other teams",
            "Explore innovative approaches"
        ]

@router.get("/assessment/{assessment_id}")
async def get_assessment_details(assessment_id: str):
    """Get detailed assessment results"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT assessment_data, maturity_level, overall_score, created_at
        FROM devops_assessments
        WHERE id = ?
        ''', (assessment_id,))
        
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        conn.close()
        
        return {
            "assessment_id": assessment_id,
            "assessment_data": json.loads(result[0]),
            "maturity_level": result[1],
            "overall_score": result[2],
            "created_at": result[3]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def generate_ai_recommendations(assessment):
    """Generate AI-powered recommendations based on assessment"""
    maturity = assessment["maturity_level"]
    score = assessment["overall_score"]
    improvement_areas = assessment["improvement_areas"]
    
    recommendations = {
        "immediate_actions": [],
        "short_term_goals": [],
        "long_term_vision": [],
        "training_needs": [],
        "tool_suggestions": []
    }
    
    # Maturity-based recommendations
    if maturity == "beginner":
        recommendations["immediate_actions"] = [
            "Implement basic version control practices",
            "Set up automated testing for critical paths",
            "Establish daily standup meetings",
            "Create incident response procedures"
        ]
        recommendations["training_needs"] = [
            "Git fundamentals",
            "Basic CI/CD concepts",
            "Agile methodologies",
            "DevOps culture introduction"
        ]
    
    elif maturity == "intermediate":
        recommendations["immediate_actions"] = [
            "Enhance CI/CD pipeline with more automation",
            "Implement comprehensive monitoring",
            "Establish infrastructure as code",
            "Improve cross-team collaboration"
        ]
        recommendations["training_needs"] = [
            "Advanced CI/CD patterns",
            "Container orchestration",
            "Monitoring and observability",
            "Site reliability engineering"
        ]
    
    elif maturity == "advanced":
        recommendations["immediate_actions"] = [
            "Implement chaos engineering practices",
            "Enhance security automation",
            "Optimize performance monitoring",
            "Mentor junior teams"
        ]
        recommendations["training_needs"] = [
            "Advanced automation techniques",
            "Performance optimization",
            "Security best practices",
            "Leadership in DevOps transformation"
        ]
    
    # Area-specific recommendations
    for area in improvement_areas:
        if area == "collaboration":
            recommendations["short_term_goals"].append("Implement regular cross-functional retrospectives")
            recommendations["tool_suggestions"].append("Slack/Teams for better communication")
        
        elif area == "automation":
            recommendations["short_term_goals"].append("Automate 80% of deployment process")
            recommendations["tool_suggestions"].extend(["Terraform", "Ansible", "GitHub Actions"])
        
        elif area == "psychological_safety":
            recommendations["long_term_vision"].append("Build blame-free culture with learning focus")
    
    return recommendations

def generate_next_steps(assessment):
    """Generate immediate next steps based on assessment"""
    score = assessment["overall_score"]
    
    if score < 40:
        return [
            "Schedule DevOps fundamentals training for the team",
            "Set up basic CI/CD pipeline for main project",
            "Implement code review process",
            "Establish monitoring for critical services"
        ]
    elif score < 70:
        return [
            "Enhance existing automation with advanced features",
            "Implement infrastructure as code",
            "Set up comprehensive monitoring and alerting",
            "Create incident response runbooks"
        ]
    else:
        return [
            "Share best practices with other teams",
            "Implement advanced DevOps patterns",
            "Focus on innovation and experimentation",
            "Mentor teams with lower maturity"
        ]

# Initialize assessment table if not exists
def init_assessment_db():
    """Initialize DevOps assessment database tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS devops_assessments (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        project_id TEXT,
        assessment_data TEXT NOT NULL,
        maturity_level TEXT NOT NULL,
        overall_score INTEGER NOT NULL,
        created_at TEXT NOT NULL
    )
    ''')
    
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transformation_roadmaps (
        id TEXT PRIMARY KEY,
        assessment_id TEXT NOT NULL,
        roadmap_data TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TEXT NOT NULL,
        FOREIGN KEY (assessment_id) REFERENCES devops_assessments (id)
    )
    ''')
    
    conn.commit()
    conn.close()

# Initialize DB when module loads
init_assessment_db()

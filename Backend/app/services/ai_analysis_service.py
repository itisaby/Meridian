"""
AI Analysis Service for repository analysis and storage
"""
import sqlite3
import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from ..services.gemini_service import gemini_service
from ..services.repo_analyzer import repo_analyzer

class AIAnalysisService:
    
    @staticmethod
    async def analyze_repository(
        user_id: str,
        repo_url: str,
        repo_full_name: str,
        persona: str = "DevOps Engineer",
        github_token: str = None
    ) -> Dict:
        """
        Perform comprehensive AI analysis of a repository and store results
        """
        try:
            # Check if recent analysis exists (within last 24 hours)
            existing_analysis = AIAnalysisService.get_latest_analysis(user_id, repo_full_name)
            
            # If recent analysis exists, return it
            if existing_analysis and AIAnalysisService._is_analysis_recent(existing_analysis):
                return {
                    "status": "success",
                    "message": "Using cached analysis",
                    "analysis": existing_analysis,
                    "is_cached": True
                }
            
            # Extract repository info
            repo_owner, repo_name = repo_full_name.split('/')
            
            # Fetch repository data
            if github_token:
                repo_data = await repo_analyzer.get_repository_info(repo_owner, repo_name, github_token)
                repo_files = await repo_analyzer.get_repository_files(repo_owner, repo_name, github_token)
            else:
                # Use mock data for testing
                repo_data = {
                    "name": repo_name,
                    "full_name": repo_full_name,
                    "description": "Repository for AI analysis",
                    "language": "Python",
                    "stargazers_count": 0,
                    "forks_count": 0,
                    "private": False,
                    "html_url": repo_url
                }
                repo_files = {
                    "README.md": "# Repository\n\nA repository for analysis.",
                    "src/main.py": "# Main application file",
                    "requirements.txt": "fastapi==0.104.1\nuvicorn==0.24.0"
                }
            
            # Perform AI analysis with enhanced prompting for dynamic scoring
            ai_analysis = await gemini_service.analyze_repository_with_dynamic_scoring(
                repo_data=repo_data,
                repo_files=repo_files,
                persona=persona,
                user_context={"role": "developer", "experience": "intermediate"}
            )
            
            # Store analysis in database
            analysis_record = AIAnalysis(
                user_id=user_id,
                repository_name=repo_name,
                repository_url=repo_url,
                repository_full_name=repo_full_name,
                devops_score=ai_analysis.get('devops_score', 0),
                persona_used=persona,
                tech_stack=ai_analysis.get('tech_stack', 'Unknown'),
                suggestions=ai_analysis.get('suggestions', []),
                analysis_summary=ai_analysis.get('analysis_summary', ''),
                strengths=ai_analysis.get('strengths', []),
                weaknesses=ai_analysis.get('weaknesses', []),
                metrics=ai_analysis.get('metrics', {}),
                analysis_version="2.0"
            )
            
            db.add(analysis_record)
            db.commit()
            db.refresh(analysis_record)
            
            return {
                "status": "success",
                "message": "Analysis completed successfully",
                "analysis": analysis_record.to_dict(),
                "is_cached": False
            }
            
        except Exception as e:
            return {
                "status": "error",
                "message": f"Analysis failed: {str(e)}",
                "analysis": None,
                "is_cached": False
            }
    
    @staticmethod
    def get_latest_analysis(db: Session, user_id: int, repo_full_name: str) -> Optional[AIAnalysis]:
        """Get the most recent analysis for a repository"""
        return db.query(AIAnalysis).filter(
            AIAnalysis.user_id == user_id,
            AIAnalysis.repository_full_name == repo_full_name
        ).order_by(AIAnalysis.created_at.desc()).first()
    
    @staticmethod
    def get_user_analyses(db: Session, user_id: int) -> List[AIAnalysis]:
        """Get all analyses for a user, grouped by repository"""
        # Get the latest analysis for each repository
        from sqlalchemy import func
        subquery = db.query(
            AIAnalysis.repository_full_name,
            func.max(AIAnalysis.created_at).label('max_created_at')
        ).filter(
            AIAnalysis.user_id == user_id
        ).group_by(AIAnalysis.repository_full_name).subquery()
        
        return db.query(AIAnalysis).join(
            subquery,
            (AIAnalysis.repository_full_name == subquery.c.repository_full_name) &
            (AIAnalysis.created_at == subquery.c.max_created_at)
        ).filter(AIAnalysis.user_id == user_id).all()
    
    @staticmethod
    def _is_analysis_recent(analysis: AIAnalysis, hours: int = 24) -> bool:
        """Check if analysis is recent (within specified hours)"""
        if not analysis.created_at:
            return False
        
        time_diff = datetime.utcnow() - analysis.created_at
        return time_diff.total_seconds() < (hours * 3600)
    
    @staticmethod
    def delete_analysis(db: Session, user_id: int, analysis_id: int) -> bool:
        """Delete a specific analysis"""
        analysis = db.query(AIAnalysis).filter(
            AIAnalysis.id == analysis_id,
            AIAnalysis.user_id == user_id
        ).first()
        
        if analysis:
            db.delete(analysis)
            db.commit()
            return True
        return False

# Initialize service instance
ai_analysis_service = AIAnalysisService()

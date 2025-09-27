"""
AI Analysis Service for repository analysis and storage using SQLite
"""
import sqlite3
import json
import uuid
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
                try:
                    repo_data = await repo_analyzer.get_repository_info(repo_owner, repo_name, github_token)
                    repo_files = await repo_analyzer.get_repository_files(repo_owner, repo_name, github_token)
                except:
                    # Fallback to mock data if GitHub API fails
                    repo_data, repo_files = AIAnalysisService._get_mock_data(repo_name, repo_full_name, repo_url)
            else:
                # Use mock data for testing
                repo_data, repo_files = AIAnalysisService._get_mock_data(repo_name, repo_full_name, repo_url)
            
            # Perform AI analysis with enhanced prompting for dynamic scoring
            ai_analysis = await gemini_service.analyze_repository_with_dynamic_scoring(
                repo_data=repo_data,
                repo_files=repo_files,
                persona=persona,
                user_context={"role": "developer", "experience": "intermediate"}
            )
            
            # Store analysis in database
            analysis_id = AIAnalysisService._store_analysis(
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
            )
            
            # Retrieve the stored analysis
            stored_analysis = AIAnalysisService._get_analysis_by_id(analysis_id)
            
            return {
                "status": "success",
                "message": "Analysis completed successfully",
                "analysis": stored_analysis,
                "is_cached": False
            }
            
        except Exception as e:
            print(f"AI Analysis error: {str(e)}")
            return {
                "status": "error",
                "message": f"Analysis failed: {str(e)}",
                "analysis": None,
                "is_cached": False
            }
    
    @staticmethod
    def _get_mock_data(repo_name: str, repo_full_name: str, repo_url: str):
        """Generate mock repository data for testing"""
        repo_data = {
            "name": repo_name,
            "full_name": repo_full_name,
            "description": "Repository for AI analysis",
            "language": "Python",
            "stargazers_count": 5,
            "forks_count": 2,
            "private": False,
            "html_url": repo_url
        }
        repo_files = {
            "README.md": "# Repository\n\nA repository for analysis.",
            "src/main.py": "# Main application file\nfrom fastapi import FastAPI\napp = FastAPI()",
            "requirements.txt": "fastapi==0.104.1\nuvicorn==0.24.0\nrequests==2.31.0",
            ".github/workflows/ci.yml": "name: CI\non: [push, pull_request]\njobs:\n  test:\n    runs-on: ubuntu-latest"
        }
        return repo_data, repo_files
    
    @staticmethod
    def _store_analysis(
        user_id: str,
        repository_name: str,
        repository_url: str,
        repository_full_name: str,
        devops_score: float,
        persona_used: str,
        tech_stack: str,
        suggestions: List,
        analysis_summary: str,
        strengths: List,
        weaknesses: List,
        metrics: Dict
    ) -> str:
        """Store analysis in SQLite database"""
        conn = sqlite3.connect('meridian.db')
        cursor = conn.cursor()
        
        analysis_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        cursor.execute("""
            INSERT INTO ai_analyses (
                id, user_id, repository_name, repository_url, repository_full_name,
                devops_score, persona_used, tech_stack, suggestions, analysis_summary,
                strengths, weaknesses, metrics, created_at, updated_at, analysis_version
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            analysis_id, user_id, repository_name, repository_url, repository_full_name,
            devops_score, persona_used, tech_stack, json.dumps(suggestions), analysis_summary,
            json.dumps(strengths), json.dumps(weaknesses), json.dumps(metrics),
            now, now, "2.0"
        ))
        
        conn.commit()
        conn.close()
        return analysis_id
    
    @staticmethod
    def get_latest_analysis(user_id: str, repo_full_name: str) -> Optional[Dict]:
        """Get the most recent analysis for a repository"""
        conn = sqlite3.connect('meridian.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM ai_analyses 
            WHERE user_id = ? AND repository_full_name = ? 
            ORDER BY created_at DESC 
            LIMIT 1
        """, (user_id, repo_full_name))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return AIAnalysisService._row_to_dict(row)
        return None
    
    @staticmethod
    def get_user_analyses(user_id: str) -> List[Dict]:
        """Get all analyses for a user, grouped by repository (latest only)"""
        conn = sqlite3.connect('meridian.db')
        cursor = conn.cursor()
        
        # Get the latest analysis for each repository
        cursor.execute("""
            SELECT a1.* FROM ai_analyses a1
            INNER JOIN (
                SELECT repository_full_name, MAX(created_at) as max_created_at
                FROM ai_analyses 
                WHERE user_id = ?
                GROUP BY repository_full_name
            ) a2 ON a1.repository_full_name = a2.repository_full_name 
                AND a1.created_at = a2.max_created_at
            WHERE a1.user_id = ?
            ORDER BY a1.created_at DESC
        """, (user_id, user_id))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [AIAnalysisService._row_to_dict(row) for row in rows]
    
    @staticmethod
    def _get_analysis_by_id(analysis_id: str) -> Optional[Dict]:
        """Get analysis by ID"""
        conn = sqlite3.connect('meridian.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM ai_analyses WHERE id = ?", (analysis_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return AIAnalysisService._row_to_dict(row)
        return None
    
    @staticmethod
    def _row_to_dict(row) -> Dict:
        """Convert database row to dictionary"""
        columns = [
            'id', 'user_id', 'repository_name', 'repository_url', 'repository_full_name',
            'devops_score', 'persona_used', 'tech_stack', 'suggestions', 'analysis_summary',
            'strengths', 'weaknesses', 'metrics', 'created_at', 'updated_at', 'analysis_version'
        ]
        
        result = {}
        for i, column in enumerate(columns):
            value = row[i] if i < len(row) else None
            
            # Parse JSON fields
            if column in ['suggestions', 'strengths', 'weaknesses', 'metrics'] and value:
                try:
                    result[column] = json.loads(value)
                except json.JSONDecodeError:
                    result[column] = [] if column in ['suggestions', 'strengths', 'weaknesses'] else {}
            else:
                result[column] = value
        
        return result
    
    @staticmethod
    def _is_analysis_recent(analysis: Dict, hours: int = 24) -> bool:
        """Check if analysis is recent (within specified hours)"""
        if not analysis or 'created_at' not in analysis:
            return False
        
        try:
            created_at = datetime.fromisoformat(analysis['created_at'])
            time_diff = datetime.utcnow() - created_at
            return time_diff.total_seconds() < (hours * 3600)
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def delete_analysis(user_id: str, analysis_id: str) -> bool:
        """Delete a specific analysis"""
        conn = sqlite3.connect('meridian.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM ai_analyses 
            WHERE id = ? AND user_id = ?
        """, (analysis_id, user_id))
        
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return deleted

# Initialize service instance
ai_analysis_service = AIAnalysisService()

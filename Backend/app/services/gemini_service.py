"""
Gemini AI Service for DevOps Analysis and Suggestions
"""
import os
import json
import asyncio
from typing import Dict, Any, List
import google.generativeai as genai
from datetime import datetime


class GeminiAIService:
    """Gemini-powered AI service for DevOps insights and suggestions"""
    
    def __init__(self):
        # Initialize Gemini
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        # Use a working Gemini model name - try different options
        try:
            self.model = genai.GenerativeModel('gemini-pro')
        except Exception:
            try:
                self.model = genai.GenerativeModel('gemini-1.5-pro')  
            except Exception:
                self.model = genai.GenerativeModel('models/gemini-pro')
        
    async def analyze_repository_with_persona(
        self,
        repo_data: Dict[str, Any],
        repo_files: Dict[str, str],
        persona: str,
        user_context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate persona-specific DevOps suggestions using Gemini
        """
        try:
            # Prepare context for Gemini
            analysis_prompt = self._build_analysis_prompt(
                repo_data, repo_files, persona, user_context
            )
            
            # Get Gemini analysis
            response = await asyncio.to_thread(
                self.model.generate_content, analysis_prompt
            )
            
            # Parse and structure the response
            suggestions = self._parse_gemini_response(response.text, persona)
            
            # Calculate DevOps maturity score
            maturity_score = self._calculate_devops_score(repo_files)
            
            return {
                "persona": persona,
                "devops_score": maturity_score,
                "suggestions": suggestions,
                "analysis_summary": self._generate_summary(suggestions, maturity_score),
                "generated_at": datetime.utcnow().isoformat(),
                "model_used": "gemini-1.5-flash"
            }
            
        except Exception as e:
            return {
                "error": f"AI analysis failed: {str(e)}",
                "persona": persona,
                "devops_score": 0,
                "suggestions": [],
                "generated_at": datetime.utcnow().isoformat()
            }
    
    def _build_analysis_prompt(
        self,
        repo_data: Dict[str, Any],
        repo_files: Dict[str, str],
        persona: str,
        user_context: Dict[str, Any]
    ) -> str:
        """Build context-aware prompt for Gemini"""
        
        persona_context = {
            "Student": {
                "focus": "learning opportunities, skill building, best practices",
                "tone": "educational, encouraging, step-by-step guidance",
                "priorities": ["learning resources", "hands-on practice", "career development"]
            },
            "Professional": {
                "focus": "optimization, efficiency, technical improvements",
                "tone": "technical, actionable, performance-oriented",
                "priorities": ["code quality", "automation", "team productivity"]
            },
            "Manager": {
                "focus": "team metrics, culture, strategic improvements",
                "tone": "strategic, business-focused, leadership-oriented",
                "priorities": ["team performance", "risk management", "ROI"]
            }
        }
        
        context = persona_context.get(persona, persona_context["Professional"])
        
        # Detect key DevOps patterns in files
        devops_patterns = self._detect_devops_patterns(repo_files)
        
        prompt = f"""
You are a DevOps Culture Transformation AI analyzing a GitHub repository for a {persona}.

REPOSITORY CONTEXT:
- Name: {repo_data.get('name', 'Unknown')}
- Language: {repo_data.get('language', 'Unknown')}
- Description: {repo_data.get('description', 'No description')}
- Stars: {repo_data.get('stars', 0)}
- Private: {repo_data.get('private', False)}

DETECTED DEVOPS PATTERNS:
{json.dumps(devops_patterns, indent=2)}

PERSONA FOCUS ({persona}):
- Focus Areas: {context['focus']}
- Tone: {context['tone']}
- Key Priorities: {', '.join(context['priorities'])}

ANALYSIS REQUIREMENTS:
Generate actionable DevOps suggestions as JSON with this structure:
{{
    "critical_suggestions": [
        {{
            "category": "CI/CD" | "Security" | "Testing" | "Documentation" | "Monitoring",
            "priority": "Critical" | "High" | "Medium" | "Low",
            "title": "Clear, actionable title",
            "description": "Detailed explanation of the issue and impact",
            "implementation_steps": ["Step 1", "Step 2", "Step 3"],
            "resources": ["Relevant documentation", "Tools", "Tutorials"],
            "estimated_effort": "1 hour" | "1 day" | "1 week",
            "business_impact": "Explanation of why this matters for {persona}"
        }}
    ],
    "improvement_areas": [
        // Same structure as critical_suggestions
    ],
    "learning_opportunities": [
        // Same structure, but focused on skill development
    ],
    "culture_insights": {{
        "current_state": "Assessment of current DevOps maturity",
        "recommended_practices": ["Practice 1", "Practice 2"],
        "team_collaboration_score": 0-100,
        "automation_level": 0-100
    }}
}}

Focus on {context['focus']} and provide {context['tone']} recommendations.
Ensure all suggestions are specific to the detected patterns and persona needs.
"""
        return prompt
    
    def _detect_devops_patterns(self, repo_files: Dict[str, str]) -> Dict[str, Any]:
        """Detect DevOps patterns in repository files"""
        patterns = {
            "ci_cd": {
                "github_actions": ".github/workflows" in str(repo_files.keys()),
                "docker": "Dockerfile" in repo_files or "docker-compose" in str(repo_files.keys()).lower(),
                "jenkins": "Jenkinsfile" in repo_files,
                "gitlab_ci": ".gitlab-ci.yml" in repo_files
            },
            "testing": {
                "has_tests": any("test" in filename.lower() for filename in repo_files.keys()),
                "test_frameworks": []
            },
            "security": {
                "secrets_scanning": ".github/workflows" in str(repo_files.keys()),
                "dependency_updates": "dependabot.yml" in str(repo_files.keys()).lower(),
                "security_policy": "SECURITY.md" in repo_files
            },
            "documentation": {
                "readme": "README.md" in repo_files,
                "contributing": "CONTRIBUTING.md" in repo_files,
                "changelog": "CHANGELOG.md" in repo_files
            },
            "infrastructure": {
                "terraform": any("terraform" in filename.lower() or filename.endswith(".tf") for filename in repo_files.keys()),
                "kubernetes": any("k8s" in filename.lower() or "kubernetes" in filename.lower() for filename in repo_files.keys())
            }
        }
        
        # Count detected patterns
        patterns["summary"] = {
            "total_patterns": sum(1 for category in patterns.values() if isinstance(category, dict) 
                                for value in category.values() if value is True),
            "maturity_indicators": []
        }
        
        return patterns
    
    def _parse_gemini_response(self, response_text: str, persona: str) -> List[Dict[str, Any]]:
        """Parse and validate Gemini's JSON response"""
        try:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                
                # Flatten all suggestion categories
                all_suggestions = []
                for category in ['critical_suggestions', 'improvement_areas', 'learning_opportunities']:
                    if category in parsed:
                        all_suggestions.extend(parsed[category])
                
                return all_suggestions
            else:
                # Fallback: create structured suggestions from text
                return self._create_fallback_suggestions(response_text, persona)
                
        except json.JSONDecodeError:
            return self._create_fallback_suggestions(response_text, persona)
    
    def _create_fallback_suggestions(self, text: str, persona: str) -> List[Dict[str, Any]]:
        """Create fallback suggestions if JSON parsing fails"""
        return [
            {
                "category": "General",
                "priority": "Medium",
                "title": f"DevOps Improvement for {persona}",
                "description": text[:200] + "..." if len(text) > 200 else text,
                "implementation_steps": ["Review the AI analysis", "Implement suggested improvements"],
                "resources": ["DevOps documentation", "Best practices guide"],
                "estimated_effort": "1 day",
                "business_impact": f"Improves overall DevOps practices for {persona}"
            }
        ]
    
    def _calculate_devops_score(self, repo_files: Dict[str, str]) -> int:
        """Calculate DevOps maturity score based on detected patterns"""
        score = 0
        total_checks = 10
        
        # CI/CD (30 points)
        if any("workflow" in filename.lower() for filename in repo_files.keys()):
            score += 30
        elif "Dockerfile" in repo_files:
            score += 15
        
        # Testing (25 points)
        if any("test" in filename.lower() for filename in repo_files.keys()):
            score += 25
        
        # Documentation (20 points)
        if "README.md" in repo_files:
            score += 10
        if "CONTRIBUTING.md" in repo_files:
            score += 5
        if any("doc" in filename.lower() for filename in repo_files.keys()):
            score += 5
        
        # Security (15 points)
        if any("security" in filename.lower() for filename in repo_files.keys()):
            score += 15
        
        # Infrastructure as Code (10 points)
        if any(filename.endswith(".tf") or "terraform" in filename.lower() 
               for filename in repo_files.keys()):
            score += 10
        
        return min(score, 100)  # Cap at 100
    
    def _generate_summary(self, suggestions: List[Dict[str, Any]], score: int) -> str:
        """Generate a summary of the analysis"""
        critical_count = len([s for s in suggestions if s.get("priority") == "Critical"])
        high_count = len([s for s in suggestions if s.get("priority") == "High"])
        
        if score >= 80:
            maturity_level = "Advanced"
        elif score >= 60:
            maturity_level = "Intermediate"
        elif score >= 40:
            maturity_level = "Basic"
        else:
            maturity_level = "Beginner"
        
        return f"DevOps Maturity: {maturity_level} ({score}/100). Found {critical_count} critical and {high_count} high-priority improvements."


# Singleton instance
gemini_service = GeminiAIService()

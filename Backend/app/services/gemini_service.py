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
        # Use Gemini 2.5 Pro model
        self.model = genai.GenerativeModel('gemini-2.5-pro')
        
    async def analyze_repository_with_dynamic_scoring(
        self,
        repo_data: Dict[str, Any],
        repo_files: Dict[str, str],
        persona: str,
        user_context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate comprehensive AI analysis with dynamic scoring specific to repository
        """
        try:
            # Prepare enhanced context for dynamic scoring
            analysis_prompt = self._build_dynamic_analysis_prompt(
                repo_data, repo_files, persona, user_context
            )
            
            # Get comprehensive Gemini analysis
            response = await asyncio.to_thread(
                self.model.generate_content, analysis_prompt
            )
            
            # Parse structured response with dynamic scoring
            analysis_result = self._parse_dynamic_gemini_response(response.text, repo_data)
            
            return analysis_result
            
        except Exception as e:
            print(f"Gemini AI analysis error: {str(e)}")
            return self._get_fallback_analysis(repo_data, persona)

    async def analyze_repository_with_persona(
        self,
        repo_data: Dict[str, Any],
        repo_files: Dict[str, str],
        persona: str,
        user_context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generate persona-specific DevOps suggestions using Gemini (legacy method)
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
    
    def _build_dynamic_analysis_prompt(
        self, 
        repo_data: Dict[str, Any], 
        repo_files: Dict[str, str], 
        persona: str, 
        user_context: Dict[str, Any]
    ) -> str:
        """Build comprehensive prompt for dynamic AI analysis"""
        
        # Analyze tech stack
        tech_indicators = {
            'Python': ['.py', 'requirements.txt', 'setup.py', 'pyproject.toml'],
            'JavaScript/Node.js': ['package.json', '.js', '.ts', '.jsx', '.tsx'],
            'Java': ['.java', 'pom.xml', 'build.gradle'],
            'C#/.NET': ['.cs', '.csproj', '.sln'],
            'Go': ['.go', 'go.mod'],
            'Rust': ['.rs', 'Cargo.toml'],
            'Docker': ['Dockerfile', 'docker-compose.yml'],
            'Kubernetes': ['.yaml', '.yml', 'k8s', 'kustomization']
        }
        
        detected_techs = []
        for tech, indicators in tech_indicators.items():
            if any(
                any(indicator in filename for indicator in indicators)
                for filename in repo_files.keys()
            ):
                detected_techs.append(tech)
        
        tech_stack = ', '.join(detected_techs) if detected_techs else 'General'
        
        prompt = f"""
You are an expert DevOps consultant analyzing a {tech_stack} repository. Provide a comprehensive analysis with dynamic scoring.

REPOSITORY CONTEXT:
- Name: {repo_data.get('name', 'Unknown')}
- Description: {repo_data.get('description', 'No description')}
- Primary Language: {repo_data.get('language', 'Unknown')}
- Stars: {repo_data.get('stargazers_count', 0)}
- Forks: {repo_data.get('forks_count', 0)}
- Tech Stack Detected: {tech_stack}

ANALYSIS PERSONA: {persona}

REPOSITORY FILES STRUCTURE:
{chr(10).join([f"- {filename}: {content[:100]}..." for filename, content in list(repo_files.items())[:10]])}

REQUIRED OUTPUT FORMAT (JSON):
{{
    "devops_score": <integer 0-100 based on actual repository analysis>,
    "tech_stack": "{tech_stack}",
    "analysis_summary": "<2-3 sentence summary of repository DevOps maturity>",
    "strengths": [
        "<strength 1>",
        "<strength 2>",
        "<strength 3>"
    ],
    "weaknesses": [
        "<weakness 1>",
        "<weakness 2>",
        "<weakness 3>"
    ],
    "suggestions": [
        {{
            "category": "<CI/CD|Testing|Security|Documentation|Monitoring|Infrastructure>",
            "priority": "<High|Medium|Low>",
            "title": "<actionable title>",
            "description": "<detailed description>",
            "implementation_steps": ["<step 1>", "<step 2>", "<step 3>"],
            "resources": ["<resource 1>", "<resource 2>"],
            "estimated_effort": "<time estimate>",
            "business_impact": "<impact description>"
        }}
    ],
    "metrics": {{
        "ci_cd_score": <0-100>,
        "testing_score": <0-100>,
        "security_score": <0-100>,
        "documentation_score": <0-100>,
        "code_quality_score": <0-100>
    }}
}}

SCORING CRITERIA:
- Analyze actual repository files and structure
- Consider tech stack specific best practices
- Base score on real DevOps maturity indicators
- Be specific to this repository's context
- Provide actionable insights for {persona}

Focus on practical, implementable suggestions tailored to the detected technology stack.
"""
        return prompt

    def _parse_dynamic_gemini_response(self, response_text: str, repo_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse structured Gemini response for dynamic analysis"""
        try:
            # Clean the response text
            clean_text = response_text.strip()
            
            # Extract JSON from response
            json_start = clean_text.find('{')
            json_end = clean_text.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                return self._get_fallback_analysis(repo_data, "DevOps Engineer")
            
            json_text = clean_text[json_start:json_end]
            analysis_data = json.loads(json_text)
            
            # Validate and sanitize the response
            return {
                "devops_score": max(0, min(100, analysis_data.get('devops_score', 50))),
                "tech_stack": analysis_data.get('tech_stack', 'General'),
                "analysis_summary": analysis_data.get('analysis_summary', 'Analysis completed'),
                "strengths": analysis_data.get('strengths', [])[:5],  # Limit to 5
                "weaknesses": analysis_data.get('weaknesses', [])[:5],  # Limit to 5
                "suggestions": analysis_data.get('suggestions', [])[:8],  # Limit to 8
                "metrics": analysis_data.get('metrics', {
                    "ci_cd_score": 50,
                    "testing_score": 50,
                    "security_score": 50,
                    "documentation_score": 50,
                    "code_quality_score": 50
                }),
                "generated_at": datetime.utcnow().isoformat(),
                "error": None
            }
            
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error parsing Gemini response: {str(e)}")
            return self._get_fallback_analysis(repo_data, "DevOps Engineer")

    def _get_fallback_analysis(self, repo_data: Dict[str, Any], persona: str) -> Dict[str, Any]:
        """Provide fallback analysis when AI fails"""
        return {
            "devops_score": 45,
            "tech_stack": repo_data.get('language', 'General'),
            "analysis_summary": f"Basic analysis completed for {repo_data.get('name', 'repository')}. AI analysis temporarily unavailable.",
            "strengths": [
                "Repository structure is organized",
                "Contains essential project files",
                "Active development visible"
            ],
            "weaknesses": [
                "Limited DevOps automation detected",
                "Testing infrastructure needs improvement",
                "Documentation could be enhanced"
            ],
            "suggestions": [
                {
                    "category": "CI/CD",
                    "priority": "High",
                    "title": "Implement Continuous Integration",
                    "description": "Set up automated testing and deployment pipeline",
                    "implementation_steps": [
                        "Choose CI/CD platform (GitHub Actions, GitLab CI, etc.)",
                        "Create workflow configuration",
                        "Add automated testing"
                    ],
                    "resources": ["CI/CD Best Practices Guide", "Platform Documentation"],
                    "estimated_effort": "1-2 days",
                    "business_impact": "Reduces deployment risks and improves code quality"
                }
            ],
            "metrics": {
                "ci_cd_score": 30,
                "testing_score": 40,
                "security_score": 50,
                "documentation_score": 60,
                "code_quality_score": 45
            },
            "generated_at": datetime.utcnow().isoformat(),
            "error": "AI analysis unavailable, using fallback"
        }
    
    def _calculate_devops_score(self, repo_files: Dict[str, str]) -> int:
        """Calculate DevOps maturity score based on detected patterns (legacy method)"""
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

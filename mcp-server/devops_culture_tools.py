"""
DevOps Culture Assessment and Guidance Tools for MCP
AI-powered DevOps culture navigation using Gemini AI
"""
import asyncio
import json
import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import google.generativeai as genai

logger = logging.getLogger("devops-culture-tools")

# DevOps Culture Framework
DEVOPS_MATURITY_FRAMEWORK = {
    "levels": {
        1: {"name": "Initial", "description": "Ad-hoc processes, manual deployments"},
        2: {"name": "Developing", "description": "Basic automation, some CI/CD"},
        3: {"name": "Defined", "description": "Standardized processes, regular releases"},
        4: {"name": "Managed", "description": "Measured and monitored practices"},
        5: {"name": "Optimizing", "description": "Continuous improvement culture"}
    },
    "dimensions": {
        "collaboration": ["Silos", "Some coordination", "Cross-functional teams", "Shared ownership", "Full integration"],
        "automation": ["Manual", "Basic scripts", "CI/CD pipeline", "Full automation", "Self-healing"],
        "monitoring": ["Reactive", "Basic metrics", "Comprehensive monitoring", "Predictive", "Intelligent"],
        "culture": ["Blame-focused", "Some sharing", "Learning culture", "Experimentation", "Innovation-driven"],
        "delivery": ["Monthly+", "Bi-weekly", "Weekly", "Daily", "On-demand"]
    }
}

async def devops_culture_assessment(
    assessment_context: Dict[str, Any],
    analysis_type: str = "comprehensive",
    gemini_model = None
) -> Dict[str, Any]:
    """
    Comprehensive DevOps culture assessment using AI analysis
    """
    try:
        team_info = assessment_context.get("team_info", {})
        assessment_responses = assessment_context.get("assessment_responses", {})
        user_history = assessment_context.get("user_history", [])
        
        logger.info(f"Processing assessment for user: {team_info.get('id', 'unknown')}")
        
        # Simple fallback scoring for now to avoid f-string issues
        scores = {
            "collaboration": assessment_responses.get("collaboration_tools", 2),
            "automation": assessment_responses.get("ci_cd_pipeline", 2),
            "monitoring": assessment_responses.get("monitoring_alerting", 2), 
            "culture": assessment_responses.get("psychological_safety", 2),
            "delivery": assessment_responses.get("deployment_frequency", 2)
        }
        
        # Calculate overall score (convert 1-5 to 0-100 scale)
        overall_score = (sum(scores.values()) / len(scores) - 1) * 25
        
        # Determine maturity level
        maturity_level = get_maturity_level_name(overall_score)
        
        return {
            "assessment_id": f"assess_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "team_id": team_info.get("id"),
            "team_name": team_info.get("name", "Unknown"),
            "assessment_date": datetime.now().isoformat(),
            "maturity_score": round(overall_score, 1),
            "maturity_level": maturity_level,
            "dimensional_scores": scores,
            "strengths": identify_strengths(scores),
            "improvement_areas": identify_improvement_areas(scores),
            "recommendations": generate_basic_recommendations(scores),
            "next_steps": generate_immediate_next_steps([]),
            "dora_prediction": {
                "deployment_frequency": "Weekly" if overall_score > 50 else "Monthly",
                "lead_time": f"{max(1, int(14 - overall_score/10))} days",
                "mttr": f"{max(1, int(24 - overall_score/5))} hours",
                "change_failure_rate": f"{max(5, int(25 - overall_score/4))}%"
            },
            "estimated_transformation_time": estimate_transformation_time(scores, overall_score),
            "mcp_powered": True
        }
        
    except Exception as e:
        logger.error(f"DevOps culture assessment failed: {e}")
        return {"error": str(e), "status": "failed"}

def generate_basic_recommendations(scores: Dict[str, int]) -> List[Dict[str, str]]:
    """Generate basic recommendations without AI"""
    recommendations = []
    
    for area, score in scores.items():
        if score <= 2:
            rec_map = {
                "collaboration": {
                    "area": "Team Collaboration",
                    "action": "Implement daily standups and regular team communication",
                    "priority": "High",
                    "effort": "2-3 weeks"
                },
                "automation": {
                    "area": "CI/CD Pipeline", 
                    "action": "Set up basic automated build and deployment pipeline",
                    "priority": "High",
                    "effort": "4-6 weeks"
                },
                "monitoring": {
                    "area": "System Monitoring",
                    "action": "Implement basic application and infrastructure monitoring",
                    "priority": "Medium",
                    "effort": "2-4 weeks"
                },
                "culture": {
                    "area": "DevOps Culture",
                    "action": "Establish blameless post-incident reviews and learning culture",
                    "priority": "Medium", 
                    "effort": "Ongoing"
                },
                "delivery": {
                    "area": "Deployment Practices",
                    "action": "Increase deployment frequency and reduce batch sizes",
                    "priority": "High",
                    "effort": "6-8 weeks"
                }
            }
            if area in rec_map:
                recommendations.append(rec_map[area])
    
    return recommendations[:5]  # Top 5 recommendations

async def analyze_team_maturity(
    team_info: Dict, 
    responses: Dict, 
    metrics: List,
    gemini_model = None
) -> Dict[str, int]:
    """Analyze team maturity across DevOps dimensions using AI"""
    
    # Prepare context for Gemini analysis
    team_name = team_info.get('name', 'Unknown')
    team_size = team_info.get('team_size', 0)
    team_roles = ', '.join(team_info.get('roles', []))
    
    analysis_prompt = f"""Analyze the DevOps maturity of this team:

Team: {team_name} ({team_size} members)
Roles: {team_roles}

Assessment Responses (1-5 scale):
{json.dumps(responses, indent=2)}

Please analyze maturity level (1-5) in each dimension and return as JSON:

{{"collaboration": 3, "automation": 2, "monitoring": 4, "culture": 3, "delivery": 2, "analysis_notes": "explanation"}}

Focus on:
- Collaboration & Communication practices
- Automation & CI/CD maturity  
- Monitoring & Observability capabilities
- Culture & Learning mindset
- Delivery & Deployment frequency"""
    
    try:
        if gemini_model:
            response = await gemini_model.generate_content_async(analysis_prompt)
            # Parse Gemini response and extract scores
            analysis_text = response.text
            
            # Try to extract JSON from response
            if "{" in analysis_text and "}" in analysis_text:
                start = analysis_text.find("{")
                end = analysis_text.rfind("}") + 1
                json_str = analysis_text[start:end]
                scores = json.loads(json_str)
                
                return {
                    "collaboration": scores.get("collaboration", 2),
                    "automation": scores.get("automation", 2),
                    "monitoring": scores.get("monitoring", 2),
                    "culture": scores.get("culture", 2),
                    "delivery": scores.get("delivery", 2),
                    "ai_analysis": analysis_text
                }
        
        # Fallback scoring based on assessment responses
        return analyze_responses_fallback(responses, metrics)
        
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        return analyze_responses_fallback(responses, metrics)

def analyze_responses_fallback(responses: Dict, metrics: List) -> Dict[str, int]:
    """Fallback analysis when AI is unavailable"""
    scores = {
        "collaboration": 2,
        "automation": 2, 
        "monitoring": 2,
        "culture": 2,
        "delivery": 2
    }
    
    # Basic scoring logic based on common assessment patterns
    if responses.get("ci_cd_pipeline", False):
        scores["automation"] += 1
    if responses.get("automated_testing", False):
        scores["automation"] += 1
    if responses.get("daily_standups", False):
        scores["collaboration"] += 1
    if responses.get("monitoring_tools", False):
        scores["monitoring"] += 1
    if responses.get("blame_free_culture", False):
        scores["culture"] += 1
    if responses.get("frequent_releases", False):
        scores["delivery"] += 1
        
    # Adjust based on metrics history
    if len(metrics) > 5:  # Good metrics tracking
        scores["monitoring"] += 1
        
    return scores

async def generate_improvement_recommendations(
    maturity_scores: Dict[str, int],
    team_info: Dict,
    gemini_model = None
) -> List[Dict[str, Any]]:
    """Generate AI-powered improvement recommendations"""
    
    recommendations_prompt = f"""
    Based on this team's DevOps maturity assessment, generate specific, actionable improvement recommendations:
    
    Team: {team_info.get('name', 'Unknown')} ({team_info.get('team_size', 0)} members)
    
    Current Maturity Scores (1-5 scale):
    - Collaboration: {maturity_scores.get('collaboration', 2)}
    - Automation: {maturity_scores.get('automation', 2)}
    - Monitoring: {maturity_scores.get('monitoring', 2)}
    - Culture: {maturity_scores.get('culture', 2)}
    - Delivery: {maturity_scores.get('delivery', 2)}
    
    Generate 5-7 specific recommendations with:
    - Area of improvement
    - Specific action items
    - Priority level (High/Medium/Low)
    - Estimated effort (hours/days/weeks)
    - Expected impact
    - Success criteria
    
    Focus on the lowest scoring areas first. Make recommendations practical and achievable.
    Return as JSON array of recommendation objects.
    """
    
    try:
        if gemini_model:
            response = gemini_model.generate_content(recommendations_prompt)
            # Extract and parse recommendations
            return parse_ai_recommendations(response.text)
        else:
            return generate_fallback_recommendations(maturity_scores)
            
    except Exception as e:
        logger.error(f"Recommendations generation failed: {e}")
        return generate_fallback_recommendations(maturity_scores)

def generate_fallback_recommendations(scores: Dict[str, int]) -> List[Dict[str, Any]]:
    """Generate fallback recommendations"""
    recommendations = []
    
    # Find lowest scoring areas
    sorted_scores = sorted(scores.items(), key=lambda x: x[1])
    
    recommendation_templates = {
        "automation": {
            "area": "CI/CD Automation",
            "action": "Set up automated build and deployment pipeline",
            "priority": "High",
            "effort": "2-3 weeks",
            "impact": "Faster, more reliable deployments"
        },
        "monitoring": {
            "area": "Monitoring & Observability", 
            "action": "Implement application and infrastructure monitoring",
            "priority": "High",
            "effort": "1-2 weeks",
            "impact": "Better visibility into system health"
        },
        "collaboration": {
            "area": "Team Collaboration",
            "action": "Establish daily standups and code review process", 
            "priority": "Medium",
            "effort": "1 week",
            "impact": "Improved communication and code quality"
        }
    }
    
    for area, score in sorted_scores[:3]:
        if area in recommendation_templates:
            recommendations.append(recommendation_templates[area])
    
    return recommendations

async def create_transformation_roadmap(
    current_maturity: Dict[str, int],
    recommendations: List[Dict],
    team_info: Dict,
    gemini_model = None
) -> Dict[str, Any]:
    """Create a detailed transformation roadmap"""
    
    roadmap = {
        "phases": [
            {
                "name": "Foundation (Month 1-2)",
                "focus": "Basic automation and monitoring",
                "goals": ["Set up CI/CD pipeline", "Implement basic monitoring"],
                "success_criteria": ["Automated deployments", "System visibility"]
            },
            {
                "name": "Enhancement (Month 3-4)", 
                "focus": "Improve collaboration and culture",
                "goals": ["Establish team practices", "Enhance monitoring"],
                "success_criteria": ["Regular code reviews", "Proactive monitoring"]
            },
            {
                "name": "Optimization (Month 5-6)",
                "focus": "Advanced practices and continuous improvement",
                "goals": ["Advanced automation", "Culture of experimentation"],
                "success_criteria": ["Self-healing systems", "Learning culture"]
            }
        ],
        "estimated_duration": "6 months",
        "milestones": generate_milestones(recommendations),
        "success_metrics": [
            "Deployment frequency increase",
            "Lead time reduction", 
            "Mean time to recovery improvement",
            "Change failure rate decrease"
        ]
    }
    
    return roadmap

def generate_milestones(recommendations: List[Dict]) -> List[Dict]:
    """Generate milestones from recommendations"""
    milestones = []
    
    for i, rec in enumerate(recommendations[:5]):
        milestones.append({
            "milestone": f"Milestone {i+1}: {rec.get('area', 'Improvement')}",
            "target_date": f"Month {i//2 + 1}",
            "deliverables": [rec.get('action', 'Complete improvement action')],
            "success_criteria": rec.get('success_criteria', 'Implementation completed')
        })
    
    return milestones

def calculate_maturity_score(maturity_scores: Dict[str, int]) -> int:
    """Calculate overall maturity score"""
    if not maturity_scores:
        return 0
    
    scores = [v for k, v in maturity_scores.items() if isinstance(v, (int, float))]
    if not scores:
        return 0
        
    return int((sum(scores) / len(scores)) * 20)  # Convert 1-5 scale to 0-100

def get_maturity_level_name(score: int) -> str:
    """Get maturity level name from score"""
    if score >= 80:
        return "Optimizing"
    elif score >= 60:
        return "Managed" 
    elif score >= 40:
        return "Defined"
    elif score >= 20:
        return "Developing"
    else:
        return "Initial"

def identify_strengths(scores: Dict[str, int]) -> List[str]:
    """Identify team strengths from scores"""
    strengths = []
    for area, score in scores.items():
        if isinstance(score, (int, float)) and score >= 4:
            strength_map = {
                "collaboration": "Strong team collaboration and communication",
                "automation": "Well-established automation practices",
                "monitoring": "Comprehensive monitoring and observability", 
                "culture": "Healthy DevOps culture and mindset",
                "delivery": "Efficient delivery and deployment practices"
            }
            if area in strength_map:
                strengths.append(strength_map[area])
    
    return strengths if strengths else ["Team shows potential for DevOps growth"]

def identify_improvement_areas(scores: Dict[str, int]) -> List[str]:
    """Identify areas needing improvement"""
    improvements = []
    for area, score in scores.items():
        if isinstance(score, (int, float)) and score <= 2:
            improvement_map = {
                "collaboration": "Team collaboration and communication practices",
                "automation": "Automation and CI/CD pipeline maturity",
                "monitoring": "Monitoring and observability capabilities",
                "culture": "DevOps culture and learning mindset", 
                "delivery": "Delivery frequency and deployment practices"
            }
            if area in improvement_map:
                improvements.append(improvement_map[area])
    
    return improvements if improvements else ["Continue building on existing strengths"]

def generate_immediate_next_steps(recommendations: List[Dict]) -> List[str]:
    """Generate immediate actionable next steps"""
    next_steps = []
    
    for rec in recommendations[:3]:  # Top 3 recommendations
        if rec.get('priority') == 'High':
            next_steps.append(f"Start: {rec.get('action', 'Implement recommendation')}")
    
    if not next_steps:
        next_steps = [
            "Conduct team DevOps readiness workshop",
            "Identify first automation opportunity", 
            "Set up basic monitoring for key metrics"
        ]
    
    return next_steps

def define_success_metrics(current_scores: Dict, recommendations: List[Dict]) -> List[str]:
    """Define success metrics for transformation"""
    return [
        "Increase deployment frequency by 50%",
        "Reduce lead time for changes by 30%",
        "Achieve 99% uptime reliability",
        "Decrease mean time to recovery by 40%",
        "Improve team satisfaction scores by 25%",
        "Increase automation coverage to 80%"
    ]

def estimate_transformation_time(scores: Dict, overall_score: int) -> str:
    """Estimate transformation timeline"""
    if overall_score >= 70:
        return "2-3 months for optimization"
    elif overall_score >= 50:
        return "4-6 months for significant improvement"
    elif overall_score >= 30:
        return "6-9 months for comprehensive transformation"
    else:
        return "9-12 months for complete DevOps adoption"

def parse_ai_recommendations(ai_text: str) -> List[Dict[str, Any]]:
    """Parse AI-generated recommendations"""
    try:
        # Try to extract JSON from AI response
        if "[" in ai_text and "]" in ai_text:
            start = ai_text.find("[")
            end = ai_text.rfind("]") + 1
            json_str = ai_text[start:end]
            return json.loads(json_str)
        else:
            # Parse text-based recommendations
            return parse_text_recommendations(ai_text)
    except Exception:
        return []

def parse_text_recommendations(text: str) -> List[Dict[str, Any]]:
    """Parse text-based recommendations when JSON parsing fails"""
    recommendations = []
    lines = text.split('\n')
    
    current_rec = {}
    for line in lines:
        line = line.strip()
        if line.startswith('Area:') or line.startswith('- Area:'):
            if current_rec:
                recommendations.append(current_rec)
            current_rec = {"area": line.split(':', 1)[1].strip()}
        elif line.startswith('Action:') or line.startswith('- Action:'):
            current_rec["action"] = line.split(':', 1)[1].strip()
        elif line.startswith('Priority:') or line.startswith('- Priority:'):
            current_rec["priority"] = line.split(':', 1)[1].strip()
        elif line.startswith('Effort:') or line.startswith('- Effort:'):
            current_rec["effort"] = line.split(':', 1)[1].strip()
        elif line.startswith('Impact:') or line.startswith('- Impact:'):
            current_rec["impact"] = line.split(':', 1)[1].strip()
    
    if current_rec:
        recommendations.append(current_rec)
    
    return recommendations

async def personalized_devops_guidance(
    user_context: Dict[str, Any],
    guidance_type: str = "comprehensive",
    gemini_model = None
) -> Dict[str, Any]:
    """
    Generate personalized DevOps guidance based on user context
    """
    try:
        user = user_context.get("user", {})
        projects = user_context.get("projects", [])
        assessments = user_context.get("recent_assessments", [])
        focus_area = user_context.get("focus_area")
        
        # Generate personalized guidance using AI
        guidance_prompt = f"""
        Generate personalized DevOps guidance for this user:
        
        User Profile:
        - Name: {user.get('name', 'Unknown')}
        - Role: {user.get('role', 'professional')}
        - GitHub: {user.get('github_username', 'N/A')}
        
        Current Projects: {len(projects)}
        {json.dumps(projects, indent=2) if projects else 'No active projects'}
        
        Recent Team Assessments:
        {json.dumps(assessments, indent=2) if assessments else 'No recent assessments'}
        
        Focus Area: {focus_area or 'General DevOps improvement'}
        
        Based on this information, provide:
        1. Personalized learning path (5-7 items)
        2. Specific action items for next 2 weeks
        3. Recommended resources and tools
        4. Skill development priorities
        5. Career advancement suggestions
        
        Tailor the guidance to their role and current project involvement.
        Return as structured JSON.
        """
        
        if gemini_model:
            response = gemini_model.generate_content(guidance_prompt)
            return parse_guidance_response(response.text, user)
        else:
            return generate_fallback_guidance(user, projects, assessments)
            
    except Exception as e:
        logger.error(f"Personalized guidance failed: {e}")
        return {"error": str(e), "status": "failed"}

def parse_guidance_response(ai_text: str, user: Dict) -> Dict[str, Any]:
    """Parse AI guidance response"""
    try:
        # Try to extract JSON
        if "{" in ai_text and "}" in ai_text:
            start = ai_text.find("{")
            end = ai_text.rfind("}") + 1
            json_str = ai_text[start:end]
            guidance = json.loads(json_str)
            
            return {
                "personalized_message": f"Welcome {user.get('name', 'there')}! Here's your DevOps journey.",
                "guidance_type": "ai_generated",
                "learning_path": guidance.get("learning_path", []),
                "action_items": guidance.get("action_items", []),
                "resources": guidance.get("resources", []),
                "skill_priorities": guidance.get("skill_priorities", []),
                "career_suggestions": guidance.get("career_suggestions", []),
                "ai_insights": ai_text
            }
    except Exception:
        pass
    
    # Fallback to text parsing
    return generate_fallback_guidance(user, [], [])

def generate_fallback_guidance(user: Dict, projects: List, assessments: List) -> Dict[str, Any]:
    """Generate fallback guidance when AI is unavailable"""
    role = user.get('role', 'professional')
    
    role_guidance = {
        'manager': {
            "learning_path": [
                "DevOps Leadership and Culture Building",
                "Team Performance Metrics and KPIs", 
                "Change Management for DevOps Transformation",
                "Scaling DevOps Practices Across Teams",
                "Executive Communication and ROI Measurement"
            ],
            "action_items": [
                "Conduct team DevOps maturity assessment",
                "Identify key transformation champions",
                "Define success metrics for DevOps initiative"
            ],
            "focus": "Leadership and organizational transformation"
        },
        'professional': {
            "learning_path": [
                "Infrastructure as Code (Terraform/CloudFormation)",
                "Container Orchestration (Kubernetes/Docker)",
                "CI/CD Pipeline Design and Implementation", 
                "Monitoring and Observability Tools",
                "Security in DevOps (DevSecOps)"
            ],
            "action_items": [
                "Set up a personal DevOps lab environment",
                "Complete a CI/CD pipeline project",
                "Learn a monitoring tool (Prometheus/Grafana)"
            ],
            "focus": "Technical skills and hands-on experience"
        }
    }
    
    guidance = role_guidance.get(role, role_guidance['professional'])
    
    return {
        "personalized_message": f"Welcome {user.get('name', 'there')}! Based on your role as {role}, here's your DevOps journey.",
        "guidance_type": "role_based",
        "focus_area": guidance["focus"],
        "learning_path": guidance["learning_path"],
        "action_items": guidance["action_items"],
        "resources": [
            {"title": "The DevOps Handbook", "type": "book", "priority": "high"},
            {"title": "Site Reliability Engineering", "type": "book", "priority": "medium"},
            {"title": "DevOps Institute Certification", "type": "certification", "priority": "high"}
        ],
        "skill_priorities": [
            "Cloud Platform Proficiency",
            "Automation Scripting",
            "Monitoring and Alerting"
        ],
        "estimated_timeline": "3-6 months for significant improvement"
    }

async def generate_adaptive_questions(
    user_history: List[Dict],
    current_level: str,
    question_count: int = 15,
    gemini_model = None
) -> List[Dict]:
    """
    Generate personalized DevOps questions based on user history and current level
    """
    try:
        # Analyze user's weak areas from history
        weak_areas = []
        if user_history:
            latest_assessment = user_history[0]
            category_scores = latest_assessment.get("category_scores", {})
            
            # Identify areas needing improvement (score < 60%)
            for category, score in category_scores.items():
                if score < 60:
                    weak_areas.append(category.lower())
        
        # Comprehensive question bank for different levels and categories
        question_bank = {
            "advanced": [
                {
                    "category": "Culture",
                    "question": "How does your organization approach post-incident reviews?",
                    "options": ["No reviews", "Blame assignment", "Basic analysis", "Blameless postmortems", "Learning-focused retrospectives"],
                    "focus": "culture_maturity"
                },
                {
                    "category": "Automation", 
                    "question": "How sophisticated is your Infrastructure as Code implementation?",
                    "options": ["No IaC", "Basic scripts", "Templated infrastructure", "Immutable infrastructure", "Self-healing systems"],
                    "focus": "infrastructure_automation"
                },
                {
                    "category": "Monitoring",
                    "question": "How comprehensive is your observability strategy?",
                    "options": ["Basic logs", "Metrics + logs", "Distributed tracing", "Full observability", "Predictive monitoring"],
                    "focus": "observability_maturity"
                },
                {
                    "category": "Collaboration",
                    "question": "How does your team handle cross-functional decision making?",
                    "options": ["Siloed decisions", "Manager approval", "Team consensus", "Delegated authority", "Autonomous teams"],
                    "focus": "team_autonomy"
                },
                {
                    "category": "Delivery",
                    "question": "What's your approach to feature flags and progressive deployment?",
                    "options": ["No feature flags", "Basic toggles", "Targeted rollouts", "Canary deployments", "Advanced experimentation"],
                    "focus": "deployment_sophistication"
                },
                {
                    "category": "Culture",
                    "question": "How does your organization approach learning from failures?",
                    "options": ["Avoid discussion", "Assign blame", "Document lessons", "Systematic learning", "Failure celebration"],
                    "focus": "learning_culture"
                },
                {
                    "category": "Automation",
                    "question": "How mature is your test automation strategy?",
                    "options": ["Manual testing", "Unit tests", "Integration tests", "E2E automation", "AI-powered testing"],
                    "focus": "testing_maturity"
                },
                {
                    "category": "Monitoring",
                    "question": "How proactive is your incident prevention approach?",
                    "options": ["Reactive only", "Basic alerting", "Predictive alerts", "Chaos engineering", "Self-healing systems"],
                    "focus": "reliability_engineering"
                },
                {
                    "category": "Collaboration",
                    "question": "How does your team approach knowledge sharing?",
                    "options": ["Ad-hoc sharing", "Documentation", "Regular sessions", "Pair programming", "Communities of practice"],
                    "focus": "knowledge_management"
                },
                {
                    "category": "Delivery",
                    "question": "How sophisticated is your deployment pipeline?",
                    "options": ["Manual deployment", "Basic CI/CD", "Multi-stage pipeline", "Zero-downtime deployment", "Autonomous deployment"],
                    "focus": "deployment_automation"
                },
                {
                    "category": "Culture",
                    "question": "How does your organization approach psychological safety?",
                    "options": ["Not considered", "Aware but limited", "Actively building", "Strong foundation", "Exemplary culture"],
                    "focus": "psychological_safety"
                },
                {
                    "category": "Automation",
                    "question": "How comprehensive is your security automation?",
                    "options": ["Manual security", "Basic scanning", "Pipeline integration", "Continuous compliance", "Zero-trust automation"],
                    "focus": "security_automation"
                },
                {
                    "category": "Monitoring",
                    "question": "How effective is your performance optimization process?",
                    "options": ["No optimization", "Ad-hoc tuning", "Regular reviews", "Continuous optimization", "AI-driven optimization"],
                    "focus": "performance_culture"
                },
                {
                    "category": "Collaboration",
                    "question": "How mature is your incident response coordination?",
                    "options": ["Chaotic response", "Basic procedures", "Defined roles", "Well-orchestrated", "Self-organizing response"],
                    "focus": "incident_coordination"
                },
                {
                    "category": "Delivery",
                    "question": "How data-driven is your product development approach?",
                    "options": ["Assumption-based", "Basic analytics", "A/B testing", "Advanced experimentation", "ML-powered insights"],
                    "focus": "data_driven_development"
                }
            ]
        }
        
        # Generate AI-enhanced questions if Gemini is available
        if gemini_model:
            prompt = f"""
            Generate {question_count} DevOps culture assessment questions for a {current_level} level practitioner.
            
            User's improvement areas based on history: {', '.join(weak_areas) if weak_areas else 'General assessment'}
            
            Please focus on:
            - {current_level.title()} level concepts
            - Areas needing improvement: {weak_areas}
            - Mix of technical practices and cultural aspects
            - 5-point scale options (worst to best)
            
            Return as JSON array with structure:
            [{{
                "category": "Collaboration|Automation|Monitoring|Culture|Delivery",
                "question": "Clear question text",
                "options": ["option1", "option2", "option3", "option4", "option5"],
                "focus": "specific_area",
                "difficulty": "{current_level}"
            }}]
            """
            
            try:
                response = await gemini_model.generate_content_async(prompt)
                ai_questions = json.loads(response.text)
                logger.info(f"Generated {len(ai_questions)} AI-powered questions")
                return ai_questions
            except Exception as e:
                logger.error(f"AI question generation failed: {e}")
        
        # Fallback to predefined questions from question bank
        available_questions = question_bank.get(current_level.lower(), question_bank["advanced"])
        
        # Select diverse questions, prioritizing weak areas if available
        selected_questions = []
        
        # First, add questions from weak areas if user has history
        if weak_areas:
            for area in weak_areas:
                area_questions = [q for q in available_questions if area.lower() in q["category"].lower()]
                selected_questions.extend(area_questions[:2])  # Max 2 per weak area
        
        # Fill remaining slots with other questions
        remaining_questions = [q for q in available_questions if q not in selected_questions]
        selected_questions.extend(remaining_questions)
        
        # Format and limit to requested count
        final_questions = []
        for i, base_q in enumerate(selected_questions[:question_count]):
            final_questions.append({
                **base_q,
                "id": f"adaptive_{i+1}",
                "difficulty": current_level,
                "personalized": True
            })
        
        return final_questions
        
    except Exception as e:
        logger.error(f"Adaptive question generation failed: {e}")
        return []

async def analyze_progress_trends(
    user_history: List[Dict],
    gemini_model = None
) -> Dict[str, Any]:
    """
    Analyze user's progress trends over time using AI
    """
    try:
        if not user_history or len(user_history) < 2:
            return {
                "trend": "insufficient_data",
                "message": "Need at least 2 assessments to analyze trends",
                "recommendations": ["Complete more assessments to track progress"]
            }
        
        # Calculate trends
        scores = [assessment.get("overall_score", 0) for assessment in user_history]
        scores.reverse()  # Oldest to newest
        
        # Simple trend analysis
        if len(scores) >= 3:
            recent_trend = scores[-1] - scores[-2]
            overall_trend = scores[-1] - scores[0]
        else:
            recent_trend = scores[-1] - scores[0] 
            overall_trend = recent_trend
        
        # AI-powered trend analysis if available
        if gemini_model and len(user_history) >= 2:
            prompt = f"""
            Analyze this DevOps practitioner's progress over time:
            
            Assessment History (oldest to newest):
            {json.dumps([{
                'date': a.get('created_at', ''),
                'score': a.get('overall_score', 0),
                'level': a.get('maturity_level', ''),
                'categories': a.get('category_scores', {})
            } for a in reversed(user_history)], indent=2)}
            
            Provide analysis in JSON format:
            {{
                "trend_direction": "improving|declining|stable",
                "progress_rate": "rapid|steady|slow",
                "strongest_area": "category with most improvement", 
                "weakest_area": "category needing attention",
                "key_insights": ["insight1", "insight2", "insight3"],
                "personalized_recommendations": ["rec1", "rec2", "rec3"],
                "motivation_message": "encouraging message based on progress"
            }}
            """
            
            try:
                response = await gemini_model.generate_content_async(prompt)
                ai_analysis = json.loads(response.text)
                logger.info("Generated AI-powered progress analysis")
                return ai_analysis
            except Exception as e:
                logger.error(f"AI trend analysis failed: {e}")
        
        # Fallback analysis
        if recent_trend > 5:
            trend_direction = "improving"
            message = f"Great progress! Recent improvement of {recent_trend:.1f} points"
        elif recent_trend < -5:
            trend_direction = "declining" 
            message = f"Recent decline of {abs(recent_trend):.1f} points - focus on fundamentals"
        else:
            trend_direction = "stable"
            message = "Maintaining steady progress"
        
        return {
            "trend_direction": trend_direction,
            "recent_change": round(recent_trend, 1),
            "overall_change": round(overall_trend, 1),
            "message": message,
            "assessment_count": len(user_history),
            "progress_rate": "steady" if abs(recent_trend) < 10 else "rapid"
        }
        
    except Exception as e:
        logger.error(f"Progress trend analysis failed: {e}")
        return {
            "trend": "analysis_failed",
            "message": "Unable to analyze progress trends",
            "error": str(e)
        }

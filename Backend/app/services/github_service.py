"""
GitHub API service for repository analysis
"""
import requests
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import re


class GitHubService:
    """Service for interacting with GitHub API and analyzing repositories"""
    
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://api.github.com"
        self.headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }

    def get_user_repositories(self, username: str = None) -> List[Dict]:
        """Get user's repositories"""
        url = f"{self.base_url}/user/repos" if not username else f"{self.base_url}/users/{username}/repos"
        params = {
            "type": "owner",
            "sort": "updated",
            "per_page": 100
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching repositories: {e}")
            return []

    def get_repository_details(self, owner: str, repo: str) -> Dict:
        """Get detailed repository information"""
        url = f"{self.base_url}/repos/{owner}/{repo}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching repository details: {e}")
            return {}

    def get_repository_commits(self, owner: str, repo: str, since_days: int = 30) -> List[Dict]:
        """Get repository commits from the last N days"""
        since_date = (datetime.now() - timedelta(days=since_days)).isoformat()
        url = f"{self.base_url}/repos/{owner}/{repo}/commits"
        params = {
            "since": since_date,
            "per_page": 100
        }
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching commits: {e}")
            return []

    def get_repository_issues(self, owner: str, repo: str, state: str = "all") -> List[Dict]:
        """Get repository issues"""
        url = f"{self.base_url}/repos/{owner}/{repo}/issues"
        params = {
            "state": state,
            "per_page": 100
        }
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching issues: {e}")
            return []

    def get_repository_pulls(self, owner: str, repo: str, state: str = "all") -> List[Dict]:
        """Get repository pull requests"""
        url = f"{self.base_url}/repos/{owner}/{repo}/pulls"
        params = {
            "state": state,
            "per_page": 100
        }
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching pull requests: {e}")
            return []

    def get_repository_languages(self, owner: str, repo: str) -> Dict:
        """Get repository programming languages"""
        url = f"{self.base_url}/repos/{owner}/{repo}/languages"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching languages: {e}")
            return {}

    def get_repository_contents(self, owner: str, repo: str, path: str = "") -> List[Dict]:
        """Get repository contents"""
        url = f"{self.base_url}/repos/{owner}/{repo}/contents/{path}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching contents: {e}")
            return []

    def analyze_devops_patterns(self, owner: str, repo: str) -> Dict[str, Any]:
        """Analyze repository for DevOps patterns and practices"""
        analysis = {
            "repository_info": {},
            "devops_score": 0,
            "commit_patterns": {},
            "ci_cd_detection": {},
            "deployment_patterns": {},
            "code_quality_indicators": {},
            "security_patterns": {},
            "collaboration_patterns": {},
            "recommendations": []
        }

        try:
            # Get repository basic info
            repo_details = self.get_repository_details(owner, repo)
            analysis["repository_info"] = {
                "name": repo_details.get("name", ""),
                "full_name": repo_details.get("full_name", ""),
                "description": repo_details.get("description", ""),
                "language": repo_details.get("language", ""),
                "size": repo_details.get("size", 0),
                "stars": repo_details.get("stargazers_count", 0),
                "forks": repo_details.get("forks_count", 0),
                "open_issues": repo_details.get("open_issues_count", 0),
                "created_at": repo_details.get("created_at", ""),
                "updated_at": repo_details.get("updated_at", ""),
                "pushed_at": repo_details.get("pushed_at", "")
            }

            # Analyze commit patterns
            commits = self.get_repository_commits(owner, repo, since_days=30)
            analysis["commit_patterns"] = self._analyze_commit_patterns(commits)

            # Detect CI/CD files and patterns
            analysis["ci_cd_detection"] = self._detect_ci_cd_patterns(owner, repo)

            # Analyze deployment patterns
            analysis["deployment_patterns"] = self._analyze_deployment_patterns(owner, repo)

            # Code quality indicators
            analysis["code_quality_indicators"] = self._analyze_code_quality(owner, repo)

            # Security patterns
            analysis["security_patterns"] = self._analyze_security_patterns(owner, repo)

            # Collaboration patterns
            analysis["collaboration_patterns"] = self._analyze_collaboration_patterns(owner, repo)

            # Calculate overall DevOps score
            analysis["devops_score"] = self._calculate_devops_score(analysis)

            # Generate recommendations
            analysis["recommendations"] = self._generate_recommendations(analysis)

        except Exception as e:
            print(f"Error in DevOps analysis: {e}")
            analysis["error"] = str(e)

        return analysis

    def _analyze_commit_patterns(self, commits: List[Dict]) -> Dict:
        """Analyze commit patterns for DevOps insights"""
        if not commits:
            return {"total_commits": 0, "frequency": "low", "commit_quality": "unknown"}

        commit_frequency = len(commits)
        commit_messages = [commit.get("commit", {}).get("message", "") for commit in commits]
        
        # Analyze commit message quality
        conventional_commits = sum(1 for msg in commit_messages if self._is_conventional_commit(msg))
        avg_message_length = sum(len(msg) for msg in commit_messages) / len(commit_messages) if commit_messages else 0
        
        # Analyze commit timing (development velocity)
        commit_dates = [commit.get("commit", {}).get("author", {}).get("date") for commit in commits]
        commit_frequency_score = "high" if commit_frequency > 20 else "medium" if commit_frequency > 10 else "low"

        return {
            "total_commits": commit_frequency,
            "frequency": commit_frequency_score,
            "conventional_commits_ratio": conventional_commits / len(commit_messages) if commit_messages else 0,
            "avg_message_length": avg_message_length,
            "commit_quality": "good" if conventional_commits / len(commit_messages) > 0.5 else "needs_improvement"
        }

    def _is_conventional_commit(self, message: str) -> bool:
        """Check if commit follows conventional commit format"""
        conventional_pattern = re.compile(r'^(feat|fix|docs|style|refactor|perf|test|chore|build|ci)(\(.+\))?: .+')
        return bool(conventional_pattern.match(message))

    def _detect_ci_cd_patterns(self, owner: str, repo: str) -> Dict:
        """Detect CI/CD configuration files and patterns"""
        ci_cd_files = [
            ".github/workflows",
            ".gitlab-ci.yml",
            "Jenkinsfile",
            ".travis.yml",
            "circle.yml",
            ".circleci",
            "azure-pipelines.yml",
            "Dockerfile",
            "docker-compose.yml",
            "k8s/",
            "kubernetes/",
            "helm/",
            "terraform/"
        ]
        
        detected_files = []
        
        try:
            # Check root directory
            contents = self.get_repository_contents(owner, repo)
            for item in contents:
                if item.get("name") in ci_cd_files or any(pattern in item.get("name", "") for pattern in ci_cd_files):
                    detected_files.append(item.get("name"))
        except Exception as e:
            print(f"Error detecting CI/CD files: {e}")

        return {
            "has_ci_cd": len(detected_files) > 0,
            "detected_files": detected_files,
            "ci_cd_score": min(len(detected_files) * 20, 100),  # Max 100
            "platforms": self._identify_ci_cd_platforms(detected_files)
        }

    def _identify_ci_cd_platforms(self, files: List[str]) -> List[str]:
        """Identify CI/CD platforms from detected files"""
        platforms = []
        
        platform_mapping = {
            "GitHub Actions": [".github/workflows"],
            "GitLab CI": [".gitlab-ci.yml"],
            "Jenkins": ["Jenkinsfile"],
            "Travis CI": [".travis.yml"],
            "CircleCI": ["circle.yml", ".circleci"],
            "Azure DevOps": ["azure-pipelines.yml"],
            "Docker": ["Dockerfile", "docker-compose.yml"],
            "Kubernetes": ["k8s/", "kubernetes/"],
            "Helm": ["helm/"],
            "Terraform": ["terraform/"]
        }
        
        for platform, indicators in platform_mapping.items():
            if any(indicator in file for file in files for indicator in indicators):
                platforms.append(platform)
        
        return platforms

    def _analyze_deployment_patterns(self, owner: str, repo: str) -> Dict:
        """Analyze deployment patterns and infrastructure"""
        patterns = {
            "containerization": False,
            "orchestration": False,
            "infrastructure_as_code": False,
            "deployment_score": 0
        }
        
        try:
            contents = self.get_repository_contents(owner, repo)
            file_names = [item.get("name", "") for item in contents]
            
            # Check for containerization
            if any("Dockerfile" in name or "docker-compose" in name for name in file_names):
                patterns["containerization"] = True
                patterns["deployment_score"] += 25
            
            # Check for orchestration
            if any("k8s" in name or "kubernetes" in name or "helm" in name for name in file_names):
                patterns["orchestration"] = True
                patterns["deployment_score"] += 25
            
            # Check for IaC
            if any("terraform" in name or "cloudformation" in name or "pulumi" in name for name in file_names):
                patterns["infrastructure_as_code"] = True
                patterns["deployment_score"] += 25
            
            patterns["detected_files"] = file_names
            
        except Exception as e:
            print(f"Error analyzing deployment patterns: {e}")
        
        return patterns

    def _analyze_code_quality(self, owner: str, repo: str) -> Dict:
        """Analyze code quality indicators"""
        quality = {
            "has_tests": False,
            "has_linting": False,
            "has_documentation": False,
            "quality_score": 0
        }
        
        try:
            contents = self.get_repository_contents(owner, repo)
            file_names = [item.get("name", "").lower() for item in contents]
            
            # Check for tests
            test_indicators = ["test/", "tests/", "__tests__/", "spec/"]
            if any(indicator in name for name in file_names for indicator in test_indicators):
                quality["has_tests"] = True
                quality["quality_score"] += 30
            
            # Check for linting/formatting
            lint_files = [".eslintrc", ".prettier", ".flake8", "pyproject.toml", "tslint.json"]
            if any(lint_file in name for name in file_names for lint_file in lint_files):
                quality["has_linting"] = True
                quality["quality_score"] += 20
            
            # Check for documentation
            doc_files = ["readme.md", "readme.rst", "docs/", "doc/"]
            if any(doc_file in name for name in file_names for doc_file in doc_files):
                quality["has_documentation"] = True
                quality["quality_score"] += 25
            
        except Exception as e:
            print(f"Error analyzing code quality: {e}")
        
        return quality

    def _analyze_security_patterns(self, owner: str, repo: str) -> Dict:
        """Analyze security patterns and practices"""
        security = {
            "has_security_policy": False,
            "has_dependabot": False,
            "has_security_workflows": False,
            "security_score": 0
        }
        
        try:
            # Check for security policy
            try:
                security_policy = self.get_repository_contents(owner, repo, "SECURITY.md")
                if security_policy:
                    security["has_security_policy"] = True
                    security["security_score"] += 20
            except:
                pass
            
            # Check for dependabot
            try:
                dependabot_config = self.get_repository_contents(owner, repo, ".github/dependabot.yml")
                if dependabot_config:
                    security["has_dependabot"] = True
                    security["security_score"] += 25
            except:
                pass
            
        except Exception as e:
            print(f"Error analyzing security patterns: {e}")
        
        return security

    def _analyze_collaboration_patterns(self, owner: str, repo: str) -> Dict:
        """Analyze collaboration and team practices"""
        collaboration = {
            "pull_request_usage": 0,
            "issue_management": 0,
            "collaboration_score": 0
        }
        
        try:
            # Analyze pull requests
            pulls = self.get_repository_pulls(owner, repo)
            collaboration["pull_request_usage"] = len(pulls)
            
            # Analyze issues
            issues = self.get_repository_issues(owner, repo)
            collaboration["issue_management"] = len(issues)
            
            # Calculate collaboration score
            pr_score = min(len(pulls) * 5, 50)  # Max 50
            issue_score = min(len(issues) * 2, 30)  # Max 30
            collaboration["collaboration_score"] = pr_score + issue_score
            
        except Exception as e:
            print(f"Error analyzing collaboration patterns: {e}")
        
        return collaboration

    def _calculate_devops_score(self, analysis: Dict) -> int:
        """Calculate overall DevOps maturity score (0-100)"""
        score = 0
        
        # Commit patterns (20 points)
        commit_score = 20 if analysis["commit_patterns"].get("commit_quality") == "good" else 10
        score += commit_score
        
        # CI/CD (25 points)
        score += analysis["ci_cd_detection"].get("ci_cd_score", 0) * 0.25
        
        # Deployment (20 points)
        score += analysis["deployment_patterns"].get("deployment_score", 0) * 0.20
        
        # Code quality (20 points)
        score += analysis["code_quality_indicators"].get("quality_score", 0) * 0.20
        
        # Security (10 points)
        score += analysis["security_patterns"].get("security_score", 0) * 0.10
        
        # Collaboration (5 points)
        score += min(analysis["collaboration_patterns"].get("collaboration_score", 0) * 0.05, 5)
        
        return min(int(score), 100)

    def _generate_recommendations(self, analysis: Dict) -> List[Dict]:
        """Generate DevOps improvement recommendations"""
        recommendations = []
        
        # CI/CD recommendations
        if not analysis["ci_cd_detection"].get("has_ci_cd"):
            recommendations.append({
                "category": "CI/CD",
                "priority": "high",
                "title": "Implement Continuous Integration",
                "description": "Add CI/CD pipeline to automate testing and deployment",
                "action": "Add .github/workflows/ci.yml for automated builds and tests"
            })
        
        # Testing recommendations
        if not analysis["code_quality_indicators"].get("has_tests"):
            recommendations.append({
                "category": "Testing",
                "priority": "high", 
                "title": "Add Automated Tests",
                "description": "Implement unit and integration tests to improve code reliability",
                "action": "Create tests/ directory and add test cases for core functionality"
            })
        
        # Documentation recommendations
        if not analysis["code_quality_indicators"].get("has_documentation"):
            recommendations.append({
                "category": "Documentation",
                "priority": "medium",
                "title": "Improve Documentation",
                "description": "Add comprehensive README and documentation",
                "action": "Create detailed README.md with setup and usage instructions"
            })
        
        # Security recommendations
        if not analysis["security_patterns"].get("has_dependabot"):
            recommendations.append({
                "category": "Security",
                "priority": "medium",
                "title": "Enable Dependency Scanning",
                "description": "Add automated dependency vulnerability scanning",
                "action": "Add .github/dependabot.yml to monitor dependencies"
            })
        
        # Deployment recommendations
        if not analysis["deployment_patterns"].get("containerization"):
            recommendations.append({
                "category": "Deployment",
                "priority": "medium",
                "title": "Containerize Application",
                "description": "Use Docker for consistent deployments across environments",
                "action": "Add Dockerfile and docker-compose.yml for containerization"
            })
        
        return recommendations

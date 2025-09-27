"""
Repository Analysis Service for fetching and analyzing repository content
"""
import requests
import base64
from typing import Dict, Any, List
import os
import asyncio


class RepositoryAnalysisService:
    """Service to fetch and analyze repository files from GitHub"""
    
    def __init__(self):
        self.github_token = None  # Will be set per request
        
    async def analyze_repository_files(self, repo_url: str, github_token: str) -> Dict[str, Any]:
        """
        Fetch key repository files for DevOps analysis
        """
        try:
            # Extract owner/repo from URL
            repo_path = self._extract_repo_path(repo_url)
            if not repo_path:
                return {"error": "Invalid repository URL"}
            
            owner, repo = repo_path
            self.github_token = github_token
            
            # Fetch repository structure and key files
            repo_files = await self._fetch_key_files(owner, repo)
            devops_analysis = self._analyze_devops_patterns(repo_files)
            
            return {
                "repo_files": repo_files,
                "devops_analysis": devops_analysis,
                "file_count": len(repo_files),
                "analysis_timestamp": "2025-09-27T18:00:00Z"
            }
            
        except Exception as e:
            return {"error": f"Repository analysis failed: {str(e)}"}
    
    def _extract_repo_path(self, repo_url: str) -> tuple:
        """Extract owner/repo from GitHub URL"""
        try:
            # Handle different URL formats
            if repo_url.startswith("https://github.com/"):
                path = repo_url.replace("https://github.com/", "")
            elif repo_url.startswith("git@github.com:"):
                path = repo_url.replace("git@github.com:", "").replace(".git", "")
            else:
                return None
            
            parts = path.strip("/").split("/")
            if len(parts) >= 2:
                return parts[0], parts[1]
            return None
        except:
            return None
    
    async def _fetch_key_files(self, owner: str, repo: str) -> Dict[str, str]:
        """Fetch key DevOps-related files from repository"""
        key_files = [
            "README.md",
            "package.json",
            "requirements.txt",
            "Dockerfile", 
            "docker-compose.yml",
            ".github/workflows/ci.yml",
            ".github/workflows/deploy.yml",
            ".github/dependabot.yml",
            "Jenkinsfile",
            ".gitlab-ci.yml",
            "main.tf",
            "terraform.tf",
            "k8s.yaml",
            "deployment.yaml",
            "CONTRIBUTING.md",
            "SECURITY.md",
            "CHANGELOG.md"
        ]
        
        files_content = {}
        
        # Fetch root directory structure first
        try:
            structure = await self._fetch_github_api(f"/repos/{owner}/{repo}/contents")
            if isinstance(structure, list):
                # Add any discovered key files
                discovered_files = [
                    item["name"] for item in structure 
                    if item["type"] == "file" and self._is_key_file(item["name"])
                ]
                key_files.extend(discovered_files)
        except:
            pass
        
        # Fetch workflows directory
        try:
            workflows = await self._fetch_github_api(f"/repos/{owner}/{repo}/contents/.github/workflows")
            if isinstance(workflows, list):
                for workflow in workflows[:3]:  # Limit to first 3 workflows
                    if workflow["type"] == "file":
                        key_files.append(f".github/workflows/{workflow['name']}")
        except:
            pass
        
        # Fetch content for each file
        for file_path in key_files:
            try:
                content = await self._fetch_file_content(owner, repo, file_path)
                if content:
                    files_content[file_path] = content
                await asyncio.sleep(0.1)  # Rate limiting
            except:
                continue
        
        return files_content
    
    def _is_key_file(self, filename: str) -> bool:
        """Check if a file is important for DevOps analysis"""
        key_patterns = [
            "dockerfile", "docker-compose", "jenkinsfile", "makefile", 
            "requirements", "package.json", "pom.xml", "build.gradle",
            "readme", "contributing", "security", "changelog", "license"
        ]
        
        return any(pattern in filename.lower() for pattern in key_patterns)
    
    async def _fetch_file_content(self, owner: str, repo: str, file_path: str) -> str:
        """Fetch content of a specific file"""
        try:
            file_data = await self._fetch_github_api(f"/repos/{owner}/{repo}/contents/{file_path}")
            
            if isinstance(file_data, dict) and "content" in file_data:
                # Decode base64 content
                content = base64.b64decode(file_data["content"]).decode("utf-8")
                # Limit content size for analysis
                return content[:5000] if len(content) > 5000 else content
            
            return ""
        except:
            return ""
    
    async def _fetch_github_api(self, endpoint: str) -> Any:
        """Fetch data from GitHub API"""
        url = f"https://api.github.com{endpoint}"
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Meridian-DevOps-Analyzer"
        }
        
        if self.github_token:
            headers["Authorization"] = f"token {self.github_token}"
        
        # Use asyncio to make HTTP request non-blocking
        response = await asyncio.to_thread(requests.get, url, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"GitHub API error: {response.status_code}")
    
    def _analyze_devops_patterns(self, repo_files: Dict[str, str]) -> Dict[str, Any]:
        """Analyze DevOps patterns in fetched files"""
        analysis = {
            "ci_cd_score": 0,
            "security_score": 0, 
            "documentation_score": 0,
            "automation_score": 0,
            "detected_tools": [],
            "missing_essentials": []
        }
        
        # CI/CD Analysis
        if any("workflow" in filename for filename in repo_files.keys()):
            analysis["ci_cd_score"] += 40
            analysis["detected_tools"].append("GitHub Actions")
        if "Jenkinsfile" in repo_files:
            analysis["ci_cd_score"] += 30
            analysis["detected_tools"].append("Jenkins")
        if ".gitlab-ci.yml" in repo_files:
            analysis["ci_cd_score"] += 30
            analysis["detected_tools"].append("GitLab CI")
        if "Dockerfile" in repo_files:
            analysis["automation_score"] += 30
            analysis["detected_tools"].append("Docker")
        
        # Security Analysis
        if "SECURITY.md" in repo_files:
            analysis["security_score"] += 25
        if "dependabot.yml" in str(repo_files.keys()).lower():
            analysis["security_score"] += 25
            analysis["detected_tools"].append("Dependabot")
        if any("test" in filename.lower() for filename in repo_files.keys()):
            analysis["security_score"] += 20
        
        # Documentation Analysis
        if "README.md" in repo_files:
            readme_content = repo_files["README.md"]
            if len(readme_content) > 500:
                analysis["documentation_score"] += 40
            else:
                analysis["documentation_score"] += 20
        if "CONTRIBUTING.md" in repo_files:
            analysis["documentation_score"] += 30
        if "CHANGELOG.md" in repo_files:
            analysis["documentation_score"] += 20
        
        # Check for missing essentials
        if not any("workflow" in f or "jenkins" in f.lower() for f in repo_files.keys()):
            analysis["missing_essentials"].append("CI/CD Pipeline")
        if "README.md" not in repo_files:
            analysis["missing_essentials"].append("Documentation")
        if not any("test" in f.lower() for f in repo_files.keys()):
            analysis["missing_essentials"].append("Automated Testing")
        if "SECURITY.md" not in repo_files:
            analysis["missing_essentials"].append("Security Policy")
        
        return analysis


# Singleton instance
repo_analyzer = RepositoryAnalysisService()

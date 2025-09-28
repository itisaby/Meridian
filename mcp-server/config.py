"""
Configuration settings for Meridian MCP Server
"""
import os
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

@dataclass
class Config:
    """Configuration class for Meridian MCP Server"""
    
    # API Configuration
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    backend_url: str = os.getenv("MERIDIAN_BACKEND_URL", "http://localhost:8000")
    
    # Database Configuration
    db_path: str = os.getenv("MERIDIAN_DB_PATH", "/Users/arnabmaity/Documents/Meridian/Backend/meridian.db")
    
    # Server Configuration
    server_name: str = "meridian-mcp"
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Feature flags
    enable_professional_tools: bool = True
    enable_manager_tools: bool = True
    enable_debugging: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # Rate limiting
    max_requests_per_minute: int = int(os.getenv("MAX_REQUESTS_PER_MINUTE", "30"))
    
    # Gemini Model Configuration
    gemini_model: str = "gemini-2.5-flash"
    max_tokens: int = 4096
    temperature: float = 0.7
    
    def validate(self) -> bool:
        """Validate configuration settings"""
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required")
        
        if not os.path.exists(os.path.dirname(self.db_path)):
            raise ValueError(f"Database directory does not exist: {os.path.dirname(self.db_path)}")
            
        return True

# Global config instance
config = Config()

def get_config() -> Config:
    """Get global configuration instance"""
    return config

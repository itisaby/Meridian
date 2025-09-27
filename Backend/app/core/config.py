"""
Core application configuration and settings
"""
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Load environment variables
load_dotenv()


# Application configuration
class Settings:
    """Application settings and configuration"""
    
    APP_NAME = "Meridian API"
    VERSION = "1.0.0"
    DEBUG = True
    
    # Database
    DATABASE_URL = "sqlite:///meridian.db"
    
    # CORS settings
    CORS_ORIGINS = ["*"]
    CORS_ALLOW_CREDENTIALS = True
    CORS_ALLOW_METHODS = ["*"]
    CORS_ALLOW_HEADERS = ["*"]
    
    # JWT settings (for future implementation)
    JWT_SECRET_KEY = "meridian_secret_key_change_in_production"
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRATION_HOURS = 24


settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 DevMind API starting up...")
    
    # Initialize database
    from ..database import init_db
    init_db()
    print("📦 Database initialized")
    
    yield
    
    # Shutdown
    print("👋 DevMind API shutting down...")


def create_app() -> FastAPI:
    """Create and configure the Meridian FastAPI application"""
    
    app = FastAPI(
        title="Meridian API",
        description="AI-Powered DevOps Culture Platform - Navigate to Excellence",
        version="1.0.0"
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )
    
    # Include routers
    from ..routes import auth, repositories, analysis, collaboration, ai_test, ai_analysis, learning_paths
    from ..api import profiles
    
    app.include_router(auth.router)
    app.include_router(repositories.router)
    app.include_router(analysis.router)
    app.include_router(collaboration.router)
    app.include_router(ai_test.router)
    app.include_router(ai_analysis.router)
    app.include_router(profiles.router)
    app.include_router(learning_paths.router)
    
    # Health check endpoint
    @app.get("/")
    async def root():
        """Root endpoint with API information"""
        return {
            "message": "DevMind API is running!",
            "version": settings.VERSION,
            "status": "healthy"
        }
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return {
            "status": "healthy",
            "version": settings.VERSION,
            "message": "Meridian API is operational"
        }
    
    return app

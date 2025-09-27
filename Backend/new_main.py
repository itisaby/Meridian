"""
Meridian API - Main application entry point

A clean, modular FastAPI application for the Meridian platform.
Navigate teams to operational excellence with AI-powered cultural guidance,
repository analysis, and real-time collaboration features.
"""

from app.core.config import create_app

# Create the FastAPI application
app = create_app()

if __name__ == "__main__":
    import uvicorn
    
    print("🧭 Starting Meridian API Server...")
    print("📍 API Documentation: http://localhost:8000/docs")
    print("🔧 Health Check: http://localhost:8000/health")
    
    uvicorn.run(
        "new_main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

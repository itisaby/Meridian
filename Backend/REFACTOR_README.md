# Meridian Backend - Refactored Structure

## 🏗️ Architecture Overview

The Meridian backend has been refactored into a clean, modular structure following FastAPI best practices. This new organization makes the code more maintainable, testable, and scalable.

## 📁 Project Structure

```
Backend/
├── app/                          # Main application package
│   ├── __init__.py              # App package initialization
│   ├── core/                    # Core application configuration
│   │   ├── __init__.py
│   │   └── config.py           # Settings, CORS, app factory
│   ├── database/                # Database operations
│   │   └── __init__.py         # DB initialization & operations
│   ├── models/                  # Pydantic schemas
│   │   └── __init__.py         # Request/response models
│   ├── routes/                  # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py             # Authentication endpoints
│   │   ├── repositories.py     # Repository management
│   │   ├── analysis.py         # AI analysis endpoints
│   │   └── collaboration.py    # WebSocket & collaboration
│   └── services/                # Business logic & external services
│       └── __init__.py         # AI service & MCP client
├── new_main.py                  # New application entry point
├── main.py                      # Original monolithic file (backup)
└── meridian.db                   # SQLite database
```

## 🚀 Key Improvements

### 1. **Separation of Concerns**

- **Models**: Pydantic schemas for API validation
- **Database**: Centralized database operations
- **Routes**: Clean API endpoint organization
- **Services**: Business logic and external integrations
- **Core**: Application configuration and setup

### 2. **Modular Design**

- Each module has a single responsibility
- Easy to test individual components
- Simple to add new features
- Clear dependencies between modules

### 3. **Scalability**

- Easy to add new route modules
- Database operations are centralized
- Services can be easily swapped or extended
- Configuration is environment-aware

## 🔄 Migration Guide

### To use the new structure:

1. **Stop the current server:**

   ```bash
   pkill -f "python main.py"
   ```

2. **Start with the new structure:**
   ```bash
   cd Backend
   python new_main.py
   ```

### The new structure maintains 100% API compatibility:

- All existing endpoints work exactly the same
- Authentication flow unchanged
- Database schema identical
- WebSocket connections preserved

## 📋 Module Breakdown

### **app/models/**init**.py**

- `User`, `UserLogin`, `UserSignup`, `UserResponse`
- `AuthResponse` - Authentication responses
- `Repository`, `RepositoryResponse` - Repository data
- `AnalysisRequest`, `AnalysisResponse` - Analysis operations
- `CollaborationSession` - Real-time collaboration
- `WSMessage` - WebSocket message format

### **app/database/**init**.py**

- `init_db()` - Database initialization
- `DatabaseManager` - Centralized database operations
  - User CRUD operations
  - Repository management
  - Collaboration session handling
  - Demo user creation

### **app/routes/auth.py**

- `POST /auth/signup` - User registration
- `POST /auth/login` - User authentication
- `GET /auth/me` - Get current user
- `POST /auth/logout` - User logout
- Token validation utilities

### **app/routes/repositories.py**

- `POST /repositories/` - Create repository
- `GET /repositories/{repo_id}` - Get repository
- `GET /repositories/{repo_id}/analysis` - Get analysis

### **app/routes/analysis.py**

- `POST /analyze/` - Analyze repository with AI
- Integration with MCP services
- Persona-based analysis

### **app/routes/collaboration.py**

- `POST /collaboration/start` - Start collaboration session
- `WebSocket /ws/{session_id}` - Real-time collaboration
- Connection management

### **app/services/**init**.py**

- `MCPClient` - Mock MCP service integration
- `AIService` - AI analysis with persona support
- Extensible service architecture

### **app/core/config.py**

- `Settings` - Application configuration
- `create_app()` - FastAPI app factory
- CORS and middleware setup
- Lifespan event handling

## 🧪 Testing

The modular structure makes testing much easier:

```bash
# Test individual modules
python -m pytest app/routes/test_auth.py
python -m pytest app/database/test_operations.py
python -m pytest app/services/test_ai_service.py
```

## 🔧 Development Benefits

1. **Easier Debugging**: Issues are isolated to specific modules
2. **Better Code Review**: Changes are focused and reviewable
3. **Team Collaboration**: Developers can work on different modules
4. **Documentation**: Each module is self-documenting
5. **Maintenance**: Updates and fixes are module-specific

## 🌟 Next Steps

With this clean structure, you can easily:

- Add new API endpoints in dedicated route files
- Extend the AI service with more sophisticated analysis
- Implement proper JWT authentication
- Add comprehensive testing
- Set up CI/CD pipelines
- Deploy to production with confidence

The refactored backend maintains all existing functionality while providing a solid foundation for future development!

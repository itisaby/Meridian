# Meridian MCP Server

Professional and Manager AI-powered tools for advanced development workflows, integrated with Gemini AI.

## Overview

The Meridian MCP Server provides advanced AI-powered tools for Professional and Manager users, offering sophisticated analysis, troubleshooting, and team management capabilities through the Model Context Protocol (MCP).

## Features

### Professional Tools 🛠️

- **Advanced Troubleshooting**: AI-powered debugging and issue resolution
- **Performance Optimization**: Code and infrastructure optimization recommendations
- **Best Practices Audit**: Comprehensive code quality and security analysis
- **Advanced Learning Suggestions**: Personalized professional development paths

### Manager Tools 👥

- **Team Collaboration Insights**: Team productivity and collaboration analysis
- **Team Learning Analysis**: Skill gap identification and learning recommendations
- **Project Health Overview**: Comprehensive project assessment and risk analysis
- **Resource Allocation Suggestions**: Team capacity and resource optimization

## Prerequisites

- Python 3.8+
- Meridian Backend running on `http://localhost:8000`
- Gemini AI API key
- SQLite database with user data

## Quick Start

1. **Setup Environment**:

   ```bash
   cd mcp-server
   ./setup.sh
   ```

2. **Configure Environment**:

   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```

3. **Start the Server**:
   ```bash
   source venv/bin/activate
   python server.py
   ```

## Configuration

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (defaults shown)
BACKEND_URL=http://localhost:8000
DATABASE_PATH=../Backend/meridian.db
LOG_LEVEL=INFO
```

### Database Requirements

The server expects a SQLite database with a `users` table:

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,  -- 'student', 'professional', 'manager'
    github_username TEXT,
    email TEXT
);
```

## Usage Examples

### List Available Tools

```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | python server.py
```

### Call Advanced Troubleshooting (Professional)

```bash
echo '{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "advanced_troubleshooting",
    "arguments": {
      "repository": "user/repo",
      "user_id": "user-id",
      "issue_description": "Application crashes on startup"
    }
  }
}' | python server.py
```

### Call Team Insights (Manager)

```bash
echo '{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "team_collaboration_insights",
    "arguments": {
      "repository": "team/project",
      "user_id": "manager-id",
      "team_size": 5
    }
  }
}' | python server.py
```

## Testing

Run the test client to verify functionality:

```bash
python test_client.py
```

Or run interactive tests:

```bash
python test_client.py --run
```

## Architecture

### Components

- **Server Core** (`server.py`): Main MCP server implementation
- **Professional Tools** (`professional_tools.py`): Advanced development tools
- **Manager Tools** (`manager_tools.py`): Team management and analysis tools
- **Test Client** (`test_client.py`): Testing and validation utilities

### Integration Points

- **Meridian Backend**: Repository analysis data and user context
- **Gemini AI**: Advanced AI analysis and recommendations
- **SQLite Database**: User roles and permissions
- **MCP Protocol**: Standard tool communication interface

## Security

- Role-based access control (RBAC)
- User context validation for all tool calls
- Secure API key management via environment variables
- Database connection security

## Development

### Adding New Tools

1. Define the tool in the appropriate file (`professional_tools.py` or `manager_tools.py`)
2. Add the tool definition to `list_tools()` in `server.py`
3. Add the tool handler to `call_tool()` in `server.py`
4. Update tests in `test_client.py`

### Tool Structure

```python
async def my_new_tool(self, user_id: str, **kwargs) -> CallToolResult:
    # 1. Validate user role
    user_context = await self.get_user_context(user_id)
    if not user_context or user_context.role not in ['professional', 'manager']:
        return CallToolResult(content=[TextContent(type="text", text="Access denied")])

    # 2. Get repository context if needed
    repo_context = await self.get_repository_context(repository, user_id)

    # 3. Prepare Gemini prompt with context
    context = {"user_role": user_context.role, "repository_analysis": repo_context}
    prompt = "Your AI analysis prompt here..."

    # 4. Call Gemini and return results
    ai_response = await self.call_gemini(prompt, context)
    return CallToolResult(content=[TextContent(type="text", text=ai_response)])
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure all dependencies are installed via `pip install -r requirements.txt`
2. **Database Connection**: Verify the backend is running and database path is correct
3. **Gemini API**: Check your API key is valid and has sufficient quota
4. **Permission Denied**: Ensure user has correct role (professional/manager)

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL=DEBUG
python server.py
```

## Contributing

1. Follow the existing code structure and patterns
2. Add comprehensive error handling and logging
3. Include role-based access control for new tools
4. Update documentation and tests
5. Validate with test client before submitting

## License

Part of the Meridian project. See main project license for details.

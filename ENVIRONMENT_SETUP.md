# 🔐 Environment Setup

## API Keys and Environment Variables

### Backend Setup
1. Copy the environment template:
   ```bash
   cd Backend
   cp .env.example .env
   ```

2. Add your Gemini API Key:
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Replace `your-gemini-api-key-here` with your actual API key in `.env`

3. Optional: Add GitHub token for enhanced repository analysis:
   - Create a GitHub personal access token
   - Replace `your-github-token-here` in `.env`

### MCP Server Setup
1. Copy the environment template:
   ```bash
   cd mcp-server
   cp .env.example .env
   ```

2. Add your Gemini API Key (same as backend)

## ⚠️ Security Notes
- Never commit `.env` files to version control
- The `.env` files are already added to `.gitignore`
- Use environment-specific files (`.env.local`, `.env.production`) for different deployments
- Rotate API keys regularly for security

## 🚀 Quick Start
Once environment variables are set up:

1. Start Backend:
   ```bash
   cd Backend
   python -m uvicorn main:app --reload
   ```

2. Start Frontend:
   ```bash
   cd meridian-nextjs
   npm run dev
   ```

3. Access Application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

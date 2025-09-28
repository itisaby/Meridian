#!/bin/bash

echo "🚀 Setting up MCP Server for Meridian..."

# Check if Python 3.13 is available
if ! command -v python3.13 &> /dev/null; then
    echo "❌ Python 3.13 is required but not installed."
    echo "Please install Python 3.13 first."
    exit 1
fi

echo "✅ Python 3.13 found"

# Create virtual environment with Python 3.13
echo "📦 Creating virtual environment..."
python3.13 -m venv venv
source venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
python3.13 -m pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
python3.13 -m pip install mcp google-generativeai requests python-dotenv

echo "✅ Setup complete!"
echo ""
echo "To run the MCP server:"
echo "1. source venv/bin/activate"
echo "2. Copy .env.example to .env and add your Gemini API key"
echo "3. python3.13 server.py"

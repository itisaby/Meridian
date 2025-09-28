#!/usr/bin/env python3
"""
Test client for Meridian MCP Server
"""
import asyncio
import json
import sys
from typing import Any, Dict


async def test_mcp_server():
    """Test the MCP server with sample requests"""
    
    # Test list tools request
    list_tools_request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list",
        "params": {}
    }
    
    print("🔧 Testing list_tools...")
    print(json.dumps(list_tools_request, indent=2))
    print("\n" + "="*50 + "\n")
    
    # Test professional tool call
    professional_tool_request = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "advanced_troubleshooting",
            "arguments": {
                "repository": "test-user/sample-repo",
                "user_id": "3d8ffc7c-4045-4a06-b97c-5cc01ca69538",
                "issue_description": "Application crashes on startup with undefined error"
            }
        }
    }
    
    print("🔍 Testing professional tool (advanced_troubleshooting)...")
    print(json.dumps(professional_tool_request, indent=2))
    print("\n" + "="*50 + "\n")
    
    # Test manager tool call
    manager_tool_request = {
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {
            "name": "team_collaboration_insights",
            "arguments": {
                "repository": "team/project-repo",
                "user_id": "3d8ffc7c-4045-4a06-b97c-5cc01ca69538",
                "team_size": 5
            }
        }
    }
    
    print("👥 Testing manager tool (team_collaboration_insights)...")
    print(json.dumps(manager_tool_request, indent=2))
    print("\n" + "="*50 + "\n")
    
    print("To test the server, run:")
    print("  echo '{}' | python server.py".format(json.dumps(list_tools_request).replace('"', '\\"')))
    print("\nOr for interactive testing:")
    print("  python server.py < test_requests.json")


def create_test_requests_file():
    """Create a test requests file for batch testing"""
    requests = [
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list",
            "params": {}
        },
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": "performance_optimization",
                "arguments": {
                    "repository": "example/webapp",
                    "user_id": "3d8ffc7c-4045-4a06-b97c-5cc01ca69538",
                    "focus_area": "database queries"
                }
            }
        }
    ]
    
    with open('/Users/arnabmaity/Documents/Meridian/mcp-server/test_requests.json', 'w') as f:
        for req in requests:
            f.write(json.dumps(req) + '\n')
    
    print("📄 Created test_requests.json for batch testing")


if __name__ == "__main__":
    print("🧪 Meridian MCP Server Test Client")
    print("="*40)
    
    create_test_requests_file()
    print()
    
    if len(sys.argv) > 1 and sys.argv[1] == "--run":
        asyncio.run(test_mcp_server())
    else:
        print("Sample MCP protocol messages:")
        print()
        asyncio.run(test_mcp_server())

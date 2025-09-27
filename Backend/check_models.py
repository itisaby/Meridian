#!/usr/bin/env python3
"""
Check available Gemini models
"""
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("No GEMINI_API_KEY found in environment")
    exit(1)

print(f"Using API key: {api_key[:10]}...")

try:
    genai.configure(api_key=api_key)
    print("\n🤖 Available Gemini Models:")
    print("=" * 50)
    
    models = genai.list_models()
    for model in models:
        if 'generateContent' in model.supported_generation_methods:
            print(f"📋 Name: {model.name}")
            print(f"   Display Name: {model.display_name}")
            print(f"   Description: {model.description}")
            print(f"   Methods: {', '.join(model.supported_generation_methods)}")
            print("-" * 40)
            
except Exception as e:
    print(f"❌ Error listing models: {e}")
    print("\nTrying alternative approach...")
    
    # Try some common model names
    common_models = [
        'gemini-pro',
        'gemini-1.5-pro', 
        'gemini-1.5-flash',
        'models/gemini-pro',
        'models/gemini-1.5-pro',
        'models/gemini-1.5-flash'
    ]
    
    print("\n🔍 Testing Common Model Names:")
    print("=" * 50)
    
    for model_name in common_models:
        try:
            model = genai.GenerativeModel(model_name)
            print(f"✅ {model_name} - Available")
        except Exception as e:
            print(f"❌ {model_name} - Error: {str(e)[:100]}")

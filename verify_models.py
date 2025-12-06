#!/usr/bin/env python3
"""
Verify that Jessica custom models are created in Ollama
Can be run from any environment (WSL, Windows, etc.)
"""
import requests
import sys
import json

OLLAMA_URL = "http://localhost:11434"

def check_ollama_running():
    """Check if Ollama is running"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=2)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

def get_installed_models():
    """Get list of installed models from Ollama"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return [model['name'] for model in data.get('models', [])]
        return []
    except requests.exceptions.RequestException as e:
        print(f"Error connecting to Ollama: {e}")
        return []

def verify_models():
    """Verify that required models exist"""
    print("=" * 50)
    print("Jessica Model Verification")
    print("=" * 50)
    print()
    
    # Check if Ollama is running
    if not check_ollama_running():
        print("❌ Ollama is not running")
        print("   Start it with: ollama serve")
        return False
    
    print("✓ Ollama is running")
    print()
    
    # Get installed models
    models = get_installed_models()
    
    # Check for required models
    required_models = {
        'qwen2.5:32b': 'Base model (required for jessica)',
        'jessica': 'Custom Jessica model (primary)',
        'jessica-business': 'Business mode model (optional)'
    }
    
    all_good = True
    print("Checking models:")
    print()
    
    for model_name, description in required_models.items():
        # Check if model exists (exact match or starts with)
        found = any(m.startswith(model_name) for m in models)
        
        if found:
            print(f"✓ {model_name:20} - {description}")
        else:
            print(f"✗ {model_name:20} - {description} - MISSING")
            if model_name == 'jessica':
                print(f"    Create with: ollama create jessica -f Modelfile")
            elif model_name == 'jessica-business':
                print(f"    Create with: ollama create jessica-business -f Modelfile.business")
            elif model_name == 'qwen2.5:32b':
                print(f"    Pull with: ollama pull qwen2.5:32b")
            all_good = False
    
    print()
    print("=" * 50)
    
    if all_good:
        print("✅ All required models are installed!")
        return True
    else:
        print("⚠️  Some models are missing. Run setup-jessica-models.sh to create them.")
        return False

if __name__ == "__main__":
    success = verify_models()
    sys.exit(0 if success else 1)


#!/usr/bin/env python3
"""Test script to show exact JSON sent to Ollama"""
import requests
import json

# Make a test call to Jessica Core
response = requests.post(
    "http://localhost:8000/chat",
    json={"message": "test", "provider": "local"},
    headers={"Content-Type": "application/json"}
)

print("=" * 60)
print("JESSICA CORE RESPONSE:")
print("=" * 60)
print(json.dumps(response.json(), indent=2))
print("\n" + "=" * 60)
print("Check /tmp/jessica-core.log for the Ollama API Request JSON")
print("=" * 60)


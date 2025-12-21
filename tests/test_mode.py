#!/usr/bin/env python3
"""Quick test for model switching"""
import requests

# Test business mode
print("Testing BUSINESS mode...")
response = requests.post(
    "http://localhost:8000/chat",
    json={"message": "Got a new creator interested", "mode": "business", "provider": "local"},
    timeout=300
)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")


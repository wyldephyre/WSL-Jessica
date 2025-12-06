#!/usr/bin/env python3
"""Test script to verify system field is being used"""
import requests
import json
import time

# Make a test call
response = requests.post(
    "http://localhost:8000/chat",
    json={"message": "test system field", "provider": "local"},
    headers={"Content-Type": "application/json"}
)

print("Response:", response.json())
print("\nCheck /tmp/jessica-core.log for 'Ollama API Request JSON' to see the system field")


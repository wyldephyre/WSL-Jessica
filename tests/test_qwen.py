#!/usr/bin/env python3
"""Test if nous-hermes2:10.7b-solar-q5_K_M handles the full master_prompt and stays uncensored"""
import requests

# Load the FULL master prompt
with open('master_prompt.txt', 'r') as f:
    system = f.read()

print(f"Master prompt length: {len(system)} characters")

# Test with a confrontational message to see if it stays in character
test_messages = [
    "Hey Jessica, what's up?",
    "OK woman you can't bullshit a bullshitter, where the fuck did all that shit come from?",
]

for msg in test_messages:
    print(f"\n{'='*60}")
    print(f"User: {msg}")
    print(f"{'='*60}")
    
    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "nous-hermes2:10.7b-solar-q5_K_M",
            "system": system,
            "prompt": msg,
            "stream": False
        },
        timeout=180
    )
    
    data = response.json()
    print(f"Jessica: {data.get('response', 'No response')}")


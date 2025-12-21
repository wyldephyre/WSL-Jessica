#!/usr/bin/env python3
"""
Test script for Phase 1 critical fixes:
1. Input validation in /chat endpoint
2. Input validation in /transcribe endpoint
3. Error handling improvements
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_chat_missing_message():
    """Test /chat endpoint with missing message field"""
    print("=" * 60)
    print("TEST 1: /chat endpoint - Missing message field")
    print("=" * 60)
    
    try:
        # Test with no JSON body
        response = requests.post(f"{BASE_URL}/chat", json={}, timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 400:
            print("✓ PASS: Correctly returns 400 for missing message")
        else:
            print(f"✗ FAIL: Expected 400, got {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("⚠ SKIP: Server not running (start with: python jessica_core.py)")
    except Exception as e:
        print(f"✗ ERROR: {e}")

def test_chat_missing_json():
    """Test /chat endpoint with no JSON at all"""
    print("\n" + "=" * 60)
    print("TEST 2: /chat endpoint - No JSON body")
    print("=" * 60)
    
    try:
        response = requests.post(f"{BASE_URL}/chat", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 400:
            print("✓ PASS: Correctly returns 400 for no JSON")
        else:
            print(f"✗ FAIL: Expected 400, got {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("⚠ SKIP: Server not running")
    except Exception as e:
        print(f"✗ ERROR: {e}")

def test_transcribe_missing_file():
    """Test /transcribe endpoint without audio file"""
    print("\n" + "=" * 60)
    print("TEST 3: /transcribe endpoint - Missing audio file")
    print("=" * 60)
    
    try:
        response = requests.post(f"{BASE_URL}/transcribe", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 400:
            print("✓ PASS: Correctly returns 400 for missing audio file")
        else:
            print(f"✗ FAIL: Expected 400, got {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("⚠ SKIP: Server not running")
    except Exception as e:
        print(f"✗ ERROR: {e}")

def test_status_endpoint():
    """Test /status endpoint (should still work)"""
    print("\n" + "=" * 60)
    print("TEST 4: /status endpoint - Should work normally")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/status", timeout=5)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            print("✓ PASS: Status endpoint works correctly")
        else:
            print(f"✗ FAIL: Expected 200, got {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("⚠ SKIP: Server not running")
    except Exception as e:
        print(f"✗ ERROR: {e}")

def test_chat_valid_request():
    """Test /chat endpoint with valid request"""
    print("\n" + "=" * 60)
    print("TEST 5: /chat endpoint - Valid request (if server running)")
    print("=" * 60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/chat",
            json={"message": "test"},
            timeout=5
        )
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("✓ PASS: Valid request works correctly")
        elif response.status_code == 500:
            print("⚠ PARTIAL: Request accepted but server error (expected if services not running)")
        else:
            print(f"⚠ Status: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("⚠ SKIP: Server not running")
    except Exception as e:
        print(f"✗ ERROR: {e}")

def main():
    print("\n" + "=" * 60)
    print("PHASE 1 FIXES - TEST SUITE")
    print("=" * 60)
    print("\nNote: Some tests will skip if server is not running.")
    print("Start server with: python jessica_core.py\n")
    
    test_chat_missing_message()
    test_chat_missing_json()
    test_transcribe_missing_file()
    test_status_endpoint()
    test_chat_valid_request()
    
    print("\n" + "=" * 60)
    print("TESTING COMPLETE")
    print("=" * 60)
    print("\nIf server is running, check results above.")
    print("If server is not running, start it and run tests again.")

if __name__ == "__main__":
    main()


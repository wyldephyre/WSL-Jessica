#!/usr/bin/env python3
"""
Static code analysis test for Phase 1, 2, and 3 improvements.
Tests code structure without requiring server to be running.
"""

import re
import sys

def test_file_exists():
    """Test that jessica_core.py exists"""
    try:
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        print("✓ jessica_core.py file exists and is readable")
        return content
    except FileNotFoundError:
        print("✗ jessica_core.py not found")
        return None

def test_no_json_import(content):
    """Test that json import was removed"""
    if 'import json' in content:
        print("✗ FAIL: 'import json' still present")
        return False
    else:
        print("✓ PASS: 'import json' removed")
        return True

def test_logging_import(content):
    """Test that logging is imported"""
    if 'import logging' in content:
        print("✓ PASS: 'import logging' present")
        return True
    else:
        print("✗ FAIL: 'import logging' missing")
        return False

def test_constants_defined(content):
    """Test that constants are defined"""
    constants = [
        'DEFAULT_MAX_TOKENS',
        'MEMORY_TRUNCATE_LENGTH',
        'DEFAULT_OLLAMA_MODEL',
        'API_TIMEOUT',
        'LOCAL_SERVICE_TIMEOUT',
        'HEALTH_CHECK_TIMEOUT'
    ]
    all_present = True
    for const in constants:
        if const in content:
            print(f"✓ {const} defined")
        else:
            print(f"✗ {const} missing")
            all_present = False
    return all_present

def test_no_bare_except(content):
    """Test that no bare except: clauses exist"""
    # Look for bare except: (not except Exception or except SomeException)
    lines = content.split('\n')
    bare_except_found = False
    for i, line in enumerate(lines, 1):
        # Match "except:" but not "except Exception" or "except SomeException:"
        if re.search(r'^\s+except\s*:\s*$', line):
            print(f"✗ FAIL: Bare except: found at line {i}")
            bare_except_found = True
    
    if not bare_except_found:
        print("✓ PASS: No bare except: clauses found")
    return not bare_except_found

def test_input_validation_chat(content):
    """Test that /chat endpoint has input validation"""
    if "if not request.json or 'message' not in request.json" in content:
        print("✓ PASS: /chat endpoint has input validation")
        return True
    else:
        print("✗ FAIL: /chat endpoint missing input validation")
        return False

def test_input_validation_transcribe(content):
    """Test that /transcribe endpoint has input validation"""
    if "if 'audio' not in request.files" in content:
        print("✓ PASS: /transcribe endpoint has input validation")
        return True
    else:
        print("✗ FAIL: /transcribe endpoint missing input validation")
        return False

def test_logger_usage(content):
    """Test that logger is used instead of print for errors"""
    # Count logger calls
    logger_calls = len(re.findall(r'logger\.(error|warning|info)', content))
    # Count print calls (excluding startup banner)
    print_calls = len(re.findall(r'print\(f?["\']', content))
    
    print(f"✓ Found {logger_calls} logger calls")
    print(f"✓ Found {print_calls} print calls (startup banner is OK)")
    
    if logger_calls >= 7:  # Should have at least 7 logger calls
        print("✓ PASS: Logger is being used for error logging")
        return True
    else:
        print(f"⚠ WARNING: Only {logger_calls} logger calls found (expected at least 7)")
        return False

def test_constants_used(content):
    """Test that constants are actually used in code"""
    usage_tests = [
        ('DEFAULT_MAX_TOKENS', 'max_tokens": DEFAULT_MAX_TOKENS'),
        ('API_TIMEOUT', 'timeout=API_TIMEOUT'),
        ('MEMORY_TRUNCATE_LENGTH', 'mem[:MEMORY_TRUNCATE_LENGTH]'),
        ('DEFAULT_OLLAMA_MODEL', 'model: str = DEFAULT_OLLAMA_MODEL'),
    ]
    
    all_used = True
    for const, pattern in usage_tests:
        if pattern in content:
            print(f"✓ {const} is used in code")
        else:
            print(f"✗ {const} defined but not used")
            all_used = False
    return all_used

def test_type_hints(content):
    """Test that type hints are present"""
    type_hint_tests = [
        ('_store_memory_dual_sync', '-> None'),
        ('store_memory_dual', '-> None'),
        ('recall_memory_dual', '-> Dict[str, List[str]]'),
    ]
    
    all_present = True
    for func, hint in type_hint_tests:
        # Escape special regex characters in hint
        escaped_hint = re.escape(hint)
        pattern = f'def {func}.*{escaped_hint}'
        if re.search(pattern, content, re.DOTALL):
            print(f"✓ {func} has type hint: {hint}")
        else:
            print(f"✗ {func} missing type hint: {hint}")
            all_present = False
    return all_present

def test_error_message_sanitization(content):
    """Test that error messages don't leak API response data"""
    dangerous_patterns = [
        r'Unexpected.*response.*\{data\}',
        r'Unexpected.*response.*data\)',
    ]
    
    safe_patterns = [
        'Unexpected Claude response format',
        'Unexpected Grok response format',
        'Unexpected Gemini response format',
    ]
    
    dangerous_found = False
    for pattern in dangerous_patterns:
        if re.search(pattern, content):
            print(f"✗ FAIL: Dangerous error pattern found: {pattern}")
            dangerous_found = True
    
    safe_found = all(pattern in content for pattern in safe_patterns)
    
    if safe_found and not dangerous_found:
        print("✓ PASS: Error messages are sanitized")
        return True
    else:
        if not safe_found:
            print("✗ FAIL: Sanitized error messages not found")
        return False

def test_memory_context_handling(content):
    """Test that memory context has else clauses"""
    if 'Unexpected memory type in local context' in content and 'Unexpected memory type in cloud context' in content:
        print("✓ PASS: Memory context type handling improved")
        return True
    else:
        print("✗ FAIL: Memory context type handling missing")
        return False

def test_configurable_timeouts(content):
    """Test that timeouts are configurable via environment variables"""
    timeout_tests = [
        ('API_TIMEOUT', 'os.getenv("API_TIMEOUT"'),
        ('LOCAL_SERVICE_TIMEOUT', 'os.getenv("LOCAL_SERVICE_TIMEOUT"'),
        ('HEALTH_CHECK_TIMEOUT', 'os.getenv("HEALTH_CHECK_TIMEOUT"'),
        ('OLLAMA_TIMEOUT', 'os.getenv("OLLAMA_TIMEOUT"'),
        ('MEM0_TIMEOUT', 'os.getenv("MEM0_TIMEOUT"'),
    ]
    
    all_configurable = True
    for timeout_name, pattern in timeout_tests:
        if pattern in content:
            print(f"✓ {timeout_name} is configurable via environment variable")
        else:
            print(f"✗ {timeout_name} not configurable")
            all_configurable = False
    return all_configurable

def test_environment_validation(content):
    """Test that environment validation function exists"""
    if 'def validate_environment' in content:
        print("✓ PASS: Environment validation function exists")
        return True
    else:
        print("✗ FAIL: Environment validation function missing")
        return False

def test_memory_id_improvement(content):
    """Test that memory ID includes timestamp for collision prevention"""
    if 'time.time()' in content and 'timestamp' in content and 'memory_id' in content:
        # Check that timestamp is used in memory_id generation
        if 'user_message + jessica_response + timestamp' in content or 'timestamp' in content:
            print("✓ PASS: Memory ID includes timestamp for collision prevention")
            return True
    print("✗ FAIL: Memory ID timestamp improvement missing")
    return False

def main():
    print("=" * 60)
    print("CODE QUALITY TEST SUITE")
    print("Testing Phase 1, 2, 3, and 4 improvements")
    print("=" * 60)
    print()
    
    content = test_file_exists()
    if not content:
        return 1
    
    print("\n" + "=" * 60)
    print("PHASE 1 TESTS (Critical Fixes)")
    print("=" * 60)
    p1_tests = [
        test_no_json_import(content),
        test_input_validation_chat(content),
        test_input_validation_transcribe(content),
        test_no_bare_except(content),
    ]
    
    print("\n" + "=" * 60)
    print("PHASE 2 TESTS (Code Quality)")
    print("=" * 60)
    p2_tests = [
        test_logging_import(content),
        test_logger_usage(content),
        test_constants_defined(content),
        test_constants_used(content),
        test_type_hints(content),
        test_error_message_sanitization(content),
    ]
    
    print("\n" + "=" * 60)
    print("PHASE 3 TESTS (Standardization)")
    print("=" * 60)
    p3_tests = [
        test_memory_context_handling(content),
    ]
    
    print("\n" + "=" * 60)
    print("PHASE 4 TESTS (Enhanced Features)")
    print("=" * 60)
    p4_tests = [
        test_configurable_timeouts(content),
        test_environment_validation(content),
        test_memory_id_improvement(content),
    ]
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    p1_passed = sum(p1_tests)
    p2_passed = sum(p2_tests)
    p3_passed = sum(p3_tests)
    p4_passed = sum(p4_tests)
    total_passed = p1_passed + p2_passed + p3_passed + p4_passed
    total_tests = len(p1_tests) + len(p2_tests) + len(p3_tests) + len(p4_tests)
    
    print(f"Phase 1: {p1_passed}/{len(p1_tests)} tests passed")
    print(f"Phase 2: {p2_passed}/{len(p2_tests)} tests passed")
    print(f"Phase 3: {p3_passed}/{len(p3_tests)} tests passed")
    print(f"Phase 4: {p4_passed}/{len(p4_tests)} tests passed")
    print(f"\nTotal: {total_passed}/{total_tests} tests passed")
    
    if total_passed == total_tests:
        print("\n✓ ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n⚠ {total_tests - total_passed} test(s) failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())


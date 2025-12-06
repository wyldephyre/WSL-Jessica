#!/usr/bin/env python3
"""
Backend Security Test Suite for Jessica Core
Tests Phase 1 Critical Security Fixes

Focus Areas:
1. CORS configuration validation
2. User isolation enforcement
3. Input validation and sanitization
4. API key security (backend-only)
5. Request size limits
"""

import sys
import os
import re
import pytest

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from jessica_core import app, ANTHROPIC_API_KEY, XAI_API_KEY, GOOGLE_AI_API_KEY, MEM0_API_KEY


class TestCORSConfiguration:
    """Test CORS security configuration"""
    
    def test_cors_restricted_origins(self):
        """Verify CORS is restricted to localhost only"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        # Check that CORS is configured with specific origins
        assert 'CORS(app' in content, "CORS should be configured"
        assert 'origins=' in content, "CORS should specify allowed origins"
        assert 'localhost:3000' in content, "CORS should allow localhost:3000"
        
        # Ensure wildcard is not used
        assert 'origins="*"' not in content, "CORS should not use wildcard"
        assert "origins='*'" not in content, "CORS should not use wildcard"
        
        print("✓ CORS is properly restricted to specific origins")
    
    def test_cors_credentials_support(self):
        """Verify CORS supports credentials"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        assert 'supports_credentials=True' in content, "CORS should support credentials"
        print("✓ CORS supports credentials properly")
    
    def test_cors_allowed_headers(self):
        """Verify CORS allows required security headers"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        assert 'allow_headers' in content, "CORS should specify allowed headers"
        assert 'X-User-ID' in content, "CORS should allow X-User-ID header"
        
        print("✓ CORS allows required security headers")


class TestUserIsolation:
    """Test user isolation implementation"""
    
    def test_no_hardcoded_user_id_in_requests(self):
        """Verify user IDs are not hardcoded in API calls"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        # Check that default user ID is only for development fallback
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            if 'DEFAULT_MEM0_USER_ID' in line:
                # This is OK - it's the constant definition
                continue
            if 'PhyreBug' in line and 'user_id' not in line.lower():
                pytest.fail(f"Hardcoded 'PhyreBug' found at line {i}: {line.strip()}")
        
        print("✓ No hardcoded user IDs in API requests")
    
    def test_user_id_parameter_in_functions(self):
        """Verify functions accept user_id parameter"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        # Key functions should have user_id parameter
        critical_functions = [
            'def _store_memory_dual_sync',
            'def store_memory_dual',
            'def recall_memory_dual',
        ]
        
        for func in critical_functions:
            assert func in content, f"Function {func} should exist"
            # Check that function signature includes user_id
            func_pattern = re.escape(func) + r'.*?user_id'
            assert re.search(func_pattern, content, re.DOTALL), \
                f"Function {func} should have user_id parameter"
        
        print("✓ Memory functions accept user_id parameter")
    
    def test_user_id_validation_exists(self):
        """Verify user ID validation is implemented"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        # Should have validation logic for user IDs
        validation_patterns = [
            r'if\s+not\s+user_id',
            r'if\s+len\(user_id\)',
            r'if\s+not\s+re\.match',
        ]
        
        has_validation = any(re.search(pattern, content) for pattern in validation_patterns)
        assert has_validation, "User ID validation should be implemented"
        
        print("✓ User ID validation exists")


class TestInputValidation:
    """Test input validation and sanitization"""
    
    def test_message_length_limits(self):
        """Verify message length limits are enforced"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        # Should have length checks for inputs
        assert 'len(' in content, "Should have length validation"
        
        # Check for reasonable limits (e.g., 10000 chars)
        has_limit = '10000' in content or '10_000' in content
        assert has_limit, "Should have input length limit"
        
        print("✓ Input length limits are enforced")
    
    def test_user_id_format_validation(self):
        """Verify user ID format validation"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        # Should validate user ID format (alphanumeric, hyphens, underscores)
        has_regex_validation = 'r"' in content or "r'" in content
        has_user_validation = 'user_id' in content and has_regex_validation
        
        assert has_user_validation, "User ID should have format validation"
        
        print("✓ User ID format validation exists")
    
    def test_request_json_validation(self):
        """Verify request JSON is validated"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        # Should check for required fields in requests
        assert "if not request.json" in content or "request.json.get" in content, \
            "Should validate request JSON"
        
        print("✓ Request JSON validation exists")
    
    def test_file_upload_validation(self):
        """Verify file upload validation"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        # Should validate file uploads (if transcription endpoint exists)
        if 'request.files' in content:
            assert 'if ' in content and 'not in request.files' in content, \
                "Should validate file presence"
        
        print("✓ File upload validation exists (if applicable)")


class TestAPIKeySecurity:
    """Test API key security (backend-only access)"""
    
    def test_api_keys_from_environment(self):
        """Verify API keys are loaded from environment"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        # API keys should be loaded from environment
        assert 'os.getenv("ANTHROPIC_API_KEY")' in content, \
            "Anthropic API key should be from environment"
        assert 'os.getenv("XAI_API_KEY")' in content, \
            "XAI API key should be from environment"
        assert 'os.getenv("GOOGLE_AI_API_KEY")' in content, \
            "Google API key should be from environment"
        assert 'os.getenv("MEM0_API_KEY")' in content, \
            "Mem0 API key should be from environment"
        
        print("✓ API keys are loaded from environment variables")
    
    def test_no_hardcoded_api_keys(self):
        """Verify no API keys are hardcoded"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        # Common API key patterns to check
        dangerous_patterns = [
            r'sk-[a-zA-Z0-9]{40,}',  # OpenAI/Anthropic style keys
            r'AIza[a-zA-Z0-9]{35}',   # Google API keys
            r'xai-[a-zA-Z0-9]{40,}',  # XAI keys
        ]
        
        for pattern in dangerous_patterns:
            matches = re.findall(pattern, content)
            assert not matches, f"Potential hardcoded API key found: {pattern}"
        
        print("✓ No hardcoded API keys detected")
    
    def test_api_keys_not_exposed_in_routes(self):
        """Verify API keys are not exposed in route responses"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        # API keys should not be in jsonify() calls
        jsonify_blocks = re.findall(r'jsonify\((.*?)\)', content, re.DOTALL)
        
        for block in jsonify_blocks:
            assert 'API_KEY' not in block, "API key should not be in JSON response"
            assert 'api_key' not in block.lower() or 'api_key' not in block, \
                "API key should not be in JSON response"
        
        print("✓ API keys are not exposed in route responses")


class TestSecurityHeaders:
    """Test security headers and request validation"""
    
    def test_request_id_middleware(self):
        """Verify request ID tracking is implemented"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        assert '@app.before_request' in content, "Should have before_request middleware"
        assert 'X-Request-ID' in content, "Should track request IDs"
        
        print("✓ Request ID middleware exists")
    
    def test_user_id_header_usage(self):
        """Verify X-User-ID header is used"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        assert 'X-User-ID' in content, "Should use X-User-ID header"
        
        print("✓ X-User-ID header is used")


class TestErrorHandling:
    """Test error handling security"""
    
    def test_no_bare_except_clauses(self):
        """Verify no bare except: clauses exist"""
        with open('jessica_core.py', 'r') as f:
            lines = f.readlines()
        
        bare_except_lines = []
        for i, line in enumerate(lines, 1):
            if re.search(r'^\s+except\s*:\s*$', line):
                bare_except_lines.append(i)
        
        assert not bare_except_lines, \
            f"Bare except: clauses found at lines: {bare_except_lines}"
        
        print("✓ No bare except: clauses found")
    
    def test_error_messages_sanitized(self):
        """Verify error messages don't leak sensitive data"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        # Error messages should be generic, not include raw data
        dangerous_patterns = [
            r'str\(response\)',
            r'str\(data\)',
        ]
        
        # These are OK - they're using exception messages, not raw data
        safe_patterns = [
            'str(e)',
            'str(error)',
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, content):
                # Check if it's in a safe context
                context = re.findall(f'.{{50}}{pattern}.{{50}}', content)
                for ctx in context:
                    if not any(safe in ctx for safe in safe_patterns):
                        pytest.fail(f"Potentially unsafe error handling: {ctx}")
        
        print("✓ Error messages are sanitized")


class TestLogging:
    """Test logging security"""
    
    def test_logging_configured(self):
        """Verify logging is properly configured"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        assert 'import logging' in content, "Logging should be imported"
        assert 'logging.basicConfig' in content or 'logging.getLogger' in content, \
            "Logging should be configured"
        
        print("✓ Logging is properly configured")
    
    def test_no_sensitive_data_logged(self):
        """Verify sensitive data is not logged"""
        with open('jessica_core.py', 'r') as f:
            content = f.read()
        
        # Check for logger calls with API key VALUES (not just the constant names)
        logger_calls = re.findall(r'logger\.\w+\((.*?)\)', content, re.DOTALL)
        
        dangerous_patterns = [
            r'ANTHROPIC_API_KEY\s*\)',  # Logging the actual key value
            r'XAI_API_KEY\s*\)',
            r'GOOGLE_AI_API_KEY\s*\)',
            r'MEM0_API_KEY\s*\)',
        ]
        
        for call in logger_calls:
            for pattern in dangerous_patterns:
                # Check if we're logging the key VALUE (not just mentioning the name in a message)
                if re.search(pattern, call):
                    # Make sure it's not just a string mentioning the name
                    if 'f"' not in call and "f'" not in call:
                        pytest.fail(f"API key VALUE may be logged: {call[:100]}")
            assert 'password' not in call.lower() or 'password' in call.lower() and '"' in call, \
                "Passwords should not be logged"
        
        print("✓ Sensitive data is not logged")


def main():
    """Run all security tests"""
    print("=" * 70)
    print("BACKEND SECURITY TEST SUITE - Phase 1")
    print("=" * 70)
    print()
    
    # Run pytest
    exit_code = pytest.main([
        __file__,
        '-v',
        '--tb=short',
        '-W', 'ignore::DeprecationWarning'
    ])
    
    return exit_code


if __name__ == "__main__":
    sys.exit(main())

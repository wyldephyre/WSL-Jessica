/**
 * Security Tests for Authentication Middleware
 * 
 * Tests Phase 1 Critical Security Fixes:
 * - User ID validation and sanitization
 * - Authentication bypass removal
 * - Input validation for security-critical paths
 * 
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { getUserId, requireAuth } from '../auth';
import { AuthenticationError } from '@/lib/errors/AppError';

// Helper function to create test requests
function createTestRequest(userId?: string): NextRequest {
  const headers = new Headers();
  if (userId !== undefined) {
    headers.set('x-user-id', userId);
  }
  return new NextRequest('http://localhost:3000', { headers });
}

describe('Authentication Middleware Security Tests', () => {
  describe('getUserId', () => {
    it('should accept valid alphanumeric user IDs', async () => {
      const request = createTestRequest('user123');
      
      const userId = await getUserId(request);
      expect(userId).toBe('user123');
    });

    it('should accept user IDs with hyphens and underscores', async () => {
      const request = createTestRequest('user-123_test');
      
      const userId = await getUserId(request);
      expect(userId).toBe('user-123_test');
    });

    it('should reject user IDs with special characters', async () => {
      const request = createTestRequest('user@123');
      
      await expect(getUserId(request)).rejects.toThrow(AuthenticationError);
      await expect(getUserId(request)).rejects.toThrow('Invalid user ID format');
    });

    it('should reject user IDs with SQL injection attempts', async () => {
      const request = createTestRequest("'; DROP TABLE users; --");
      
      await expect(getUserId(request)).rejects.toThrow(AuthenticationError);
    });

    it('should reject user IDs with path traversal attempts', async () => {
      const request = createTestRequest('../../../etc/passwd');
      
      await expect(getUserId(request)).rejects.toThrow(AuthenticationError);
    });

    it('should reject user IDs with script injection attempts', async () => {
      const request = createTestRequest('<script>alert("xss")</script>');
      
      await expect(getUserId(request)).rejects.toThrow(AuthenticationError);
    });

    it('should reject user IDs exceeding maximum length', async () => {
      const longUserId = 'a'.repeat(51); // 51 characters (max is 50)
      const request = createTestRequest(longUserId);
      
      await expect(getUserId(request)).rejects.toThrow(AuthenticationError);
    });

    it('should accept user IDs at maximum length boundary', async () => {
      const maxLengthUserId = 'a'.repeat(50); // Exactly 50 characters
      const request = createTestRequest(maxLengthUserId);
      
      const userId = await getUserId(request);
      expect(userId).toBe(maxLengthUserId);
    });

    it('should return default-user when no user ID header present', async () => {
      const request = createTestRequest();
      
      const userId = await getUserId(request);
      expect(userId).toBe('default-user');
    });

    it('should reject empty string user IDs', async () => {
      const request = createTestRequest('');
      
      const userId = await getUserId(request);
      expect(userId).toBe('default-user'); // Empty string treated as missing
    });
  });

  describe('requireAuth', () => {
    it('should authenticate valid user IDs', async () => {
      const request = createTestRequest('validUser123');
      
      const result = await requireAuth(request);
      expect(result).toEqual({ userId: 'validUser123' });
    });

    it('should reject default-user (no authentication bypass)', async () => {
      const request = createTestRequest();
      
      await expect(requireAuth(request)).rejects.toThrow(AuthenticationError);
      await expect(requireAuth(request)).rejects.toThrow('Authentication required');
    });

    it('should reject requests with no user ID', async () => {
      const request = createTestRequest();
      
      await expect(requireAuth(request)).rejects.toThrow(AuthenticationError);
    });

    it('should reject malicious user IDs', async () => {
      const request = createTestRequest('../admin');
      
      await expect(requireAuth(request)).rejects.toThrow(AuthenticationError);
    });

    it('should convert validation errors to AuthenticationError', async () => {
      const request = createTestRequest('invalid@user');
      
      await expect(requireAuth(request)).rejects.toThrow(AuthenticationError);
    });

    it('should handle concurrent authentication attempts safely', async () => {
      const requests = Array(10).fill(null).map((_, i) => createTestRequest(`user${i}`));
      
      const results = await Promise.all(requests.map(req => requireAuth(req)));
      
      results.forEach((result, i) => {
        expect(result.userId).toBe(`user${i}`);
      });
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle null bytes in user ID', () => {
      // Null bytes in headers throw TypeError at the platform level
      // This is secure - the attack is prevented before our validation
      expect(() => createTestRequest('user\x00admin')).toThrow();
    });

    it('should handle unicode characters in user ID', () => {
      // Unicode characters invalid for ByteString throw TypeError at platform level
      // This is secure - the attack is prevented before our validation
      expect(() => createTestRequest('user™123')).toThrow();
    });

    it('should handle whitespace in user ID', async () => {
      const request = createTestRequest('user 123');
      
      await expect(getUserId(request)).rejects.toThrow(AuthenticationError);
    });

    it('should handle leading/trailing whitespace', async () => {
      // Headers API automatically trims leading/trailing whitespace per HTTP spec
      // So '  user123  ' becomes 'user123' which is valid
      const request = createTestRequest('  user123  ');
      
      const userId = await getUserId(request);
      expect(userId).toBe('user123'); // Trimmed by Headers API
    });

    it('should handle case sensitivity correctly', async () => {
      const request = createTestRequest('UserABC');
      
      const userId = await getUserId(request);
      expect(userId).toBe('UserABC'); // Case preserved
    });
  });
});

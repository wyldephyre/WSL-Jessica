import { NextRequest } from 'next/server';
import { AuthenticationError } from '@/lib/errors/AppError';

/**
 * Get user ID from request
 * SECURITY FIX: Added proper validation
 */
export async function getUserId(request: NextRequest): Promise<string> {
  const userId = request.headers.get('x-user-id');
  
  // SECURITY FIX: Validate user ID format
  if (userId) {
    // Only allow alphanumeric characters, hyphens, and underscores
    // Maximum length of 50 characters
    if (!/^[a-zA-Z0-9_-]+$/.test(userId) || userId.length > 50) {
      throw new AuthenticationError('Invalid user ID format');
    }
  }
  
  return userId || 'default-user';
}

/**
 * Require authentication and return user ID
 * SECURITY FIX: Removed development bypass
 */
export async function requireAuth(request: NextRequest): Promise<{ userId: string }> {
  try {
    const userId = await getUserId(request);
    
    // SECURITY FIX: Always require real authentication
    if (!userId || userId === 'default-user') {
      throw new AuthenticationError('Authentication required');
    }
    
    return { userId };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Authentication failed');
  }
}


// SECURITY FIX: Removed direct API client imports - all calls now go through backend routes

import { env } from '@/lib/config/env';

export type AIProvider = 'claude' | 'gemini' | 'grok' | 'local';

export interface AIProviderResponse {
  content: string;
  provider: AIProvider;
}

/**
 * Get the base URL for API calls
 * Uses absolute URL when running server-side (Next.js API routes)
 */
function getApiBaseUrl(): string {
  // Server-side: use localhost:3000 (Next.js dev server)
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
  }
  // Client-side: use relative URL
  return '';
}

/**
 * Call AI provider via backend routes (SECURITY FIX: No more direct API access)
 */
export async function callAIProvider(
  provider: AIProvider,
  message: string,
  systemPrompt?: string,
  userId: string = 'default-user' // Not used - kept for backward compatibility
): Promise<AIProviderResponse> {
  // SECURITY FIX: All providers now call backend routes instead of using API keys directly
  // Single-user system: user_id no longer needed - backend uses constant
  const basePayload = {
    message,
    ...(systemPrompt && { systemPrompt }),
  };

  const baseUrl = getApiBaseUrl();

  switch (provider) {
    case 'claude': {
      const response = await fetch(`${baseUrl}/api/chat/claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(basePayload),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.message || '',
        provider: 'claude',
      };
    }

    case 'gemini': {
      const response = await fetch(`${baseUrl}/api/chat/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(basePayload),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.message || '',
        provider: 'gemini',
      };
    }

    case 'grok': {
      const response = await fetch(`${baseUrl}/api/chat/grok`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(basePayload),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.message || '',
        provider: 'grok',
      };
    }

    case 'local': {
      // Call local provider through Next.js API route (server-side proxy)
      // This ensures proper routing through WSL network stack
      const response = await fetch(`${baseUrl}/api/chat/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          provider: 'local',
          ...(systemPrompt && { systemPrompt }),
        }),
      });

      if (!response.ok) {
        throw new Error(`Local API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.content || data.response || '',
        provider: 'local',
      };
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}


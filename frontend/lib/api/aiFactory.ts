// SECURITY FIX: Removed direct API client imports - all calls now go through backend routes

import { env } from '@/lib/config/env';

export type AIProvider = 'claude' | 'gemini' | 'grok' | 'local';

export interface AIProviderResponse {
  content: string;
  provider: AIProvider;
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

  switch (provider) {
    case 'claude': {
      const response = await fetch('/api/chat/claude', {
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
      const response = await fetch('/api/chat/gemini', {
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
      const response = await fetch('/api/chat/grok', {
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
      // Call Jessica Core backend
      const apiUrl = env.API_URL || 'http://localhost:8000';
      const payload = {
        message,
        provider: 'local',
      };
      
      // Debug logging (server-side only)
      if (typeof window === 'undefined') {
        console.log('[AI Factory] Calling backend:', apiUrl, 'Payload:', JSON.stringify(payload));
      }
      
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `Local API error: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If JSON parsing fails, use status text
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return {
        content: data.response || '',
        provider: 'local',
      };
    }

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}


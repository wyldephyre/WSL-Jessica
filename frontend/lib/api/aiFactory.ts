// SECURITY FIX: Removed direct API client imports - all calls now go through backend routes

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
  userId: string = 'default-user'
): Promise<AIProviderResponse> {
  // SECURITY FIX: All providers now call backend routes instead of using API keys directly
  const basePayload = {
    message,
    user_id: userId,
    ...(systemPrompt && { systemPrompt }),
  };

  switch (provider) {
    case 'claude': {
      const response = await fetch('/api/chat/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
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
          'X-User-ID': userId,
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
          'X-User-ID': userId,
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
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          user_id: userId,
          provider: 'local',
        }),
      });

      if (!response.ok) {
        throw new Error(`Local API error: ${response.statusText}`);
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


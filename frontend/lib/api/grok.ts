import { env } from '@/lib/config/env';

// Grok client interface (for backward compatibility)
interface GrokClient {
  chat: {
    completions: {
      create: (options: any) => Promise<any>;
    };
  };
}

/**
 * Call Grok API via backend proxy endpoint
 * API keys are now stored server-side only
 * Single-user system: user_id no longer needed - backend uses constant
 * 
 * @param message - User message to send to Grok
 * @param systemPrompt - Optional system prompt
 * @param userId - Not used (kept for backward compatibility)
 * @returns Promise resolving to Grok's response
 */
export async function callGrokViaProxy(
  message: string,
  userId: string = '', // Not used - kept for backward compatibility
  systemPrompt: string = ''
): Promise<string> {
  const response = await fetch(`${env.API_URL}/api/proxy/grok`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      system_prompt: systemPrompt,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

/**
 * Get or create Grok client (legacy compatibility)
 * Now calls backend proxy instead of using API key directly
 * @deprecated Use callGrokViaProxy instead
 */
export function getGrokClient(): GrokClient {
  // Return a mock client object for backward compatibility
  // Actual calls should use callGrokViaProxy
  return {
    chat: {
      completions: {
        create: async (options: any) => {
          // This should not be called directly - use callGrokViaProxy instead
          throw new Error('Direct Grok client calls are deprecated. Use callGrokViaProxy instead.');
        },
      },
    },
  };
}


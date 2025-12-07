import { env } from '@/lib/config/env';

/**
 * Call Gemini API via backend proxy endpoint
 * API keys are now stored server-side only
 * Single-user system: user_id no longer needed - backend uses constant
 * 
 * @param message - User message to send to Gemini
 * @param systemPrompt - Optional system prompt
 * @param userId - Not used (kept for backward compatibility)
 * @returns Promise resolving to Gemini's response
 */
export async function callGeminiViaProxy(
  message: string,
  userId: string = '', // Not used - kept for backward compatibility
  systemPrompt: string = ''
): Promise<string> {
  const response = await fetch(`${env.API_URL}/api/proxy/gemini`, {
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
 * Get or create Gemini model (legacy compatibility)
 * Now calls backend proxy instead of using API key directly
 * @deprecated Use callGeminiViaProxy instead
 */
export function getGeminiModel(): any {
  // Return a mock model object for backward compatibility
  // Actual calls should use callGeminiViaProxy
  return {
    generateContent: async (prompt: any) => {
      // This should not be called directly - use callGeminiViaProxy instead
      throw new Error('Direct Gemini model calls are deprecated. Use callGeminiViaProxy instead.');
    },
  };
}


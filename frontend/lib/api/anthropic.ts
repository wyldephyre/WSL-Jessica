import { env } from '@/lib/config/env';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Call Claude API via backend proxy endpoint
 * API keys are now stored server-side only
 * Single-user system: user_id no longer needed - backend uses constant
 * 
 * @param message - User message to send to Claude
 * @param systemPrompt - Optional system prompt
 * @param userId - Not used (kept for backward compatibility)
 * @param model - Optional model name (default: claude-sonnet-4-20250514)
 * @returns Promise resolving to Claude's response
 */
export async function callClaudeViaProxy(
  message: string,
  userId: string = '', // Not used - kept for backward compatibility
  systemPrompt: string = '',
  model: string = 'claude-sonnet-4-20250514'
): Promise<string> {
  const response = await fetch(`${env.API_URL}/api/proxy/claude`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      system_prompt: systemPrompt,
      model,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

let anthropicClient: Anthropic | null = null;

/**
 * Get or create Anthropic client
 * NOTE: This is for server-side Next.js API routes only (not browser)
 * Server-side routes can use API keys from process.env directly
 * Browser code should use callClaudeViaProxy instead
 */
export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    // Server-side only: Access API key from process.env (not exposed to browser)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured in server environment');
    }
    anthropicClient = new Anthropic({
      apiKey: apiKey,
    });
  }
  return anthropicClient;
}


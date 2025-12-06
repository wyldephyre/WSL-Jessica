import { env } from '@/lib/config/env';

// Grok client interface (using fetch API directly since xai-sdk may not be available)
interface GrokClient {
  chat: {
    completions: {
      create: (options: any) => Promise<any>;
    };
  };
}

let grokClient: GrokClient | null = null;

/**
 * Get or create Grok client (using fetch API)
 */
export function getGrokClient(): GrokClient {
  if (!grokClient) {
    if (!env.XAI_API_KEY) {
      throw new Error('XAI_API_KEY not configured');
    }
    
    // Create a client-like object that uses fetch
    grokClient = {
      chat: {
        completions: {
          create: async (options: any) => {
            const response = await fetch('https://api.x.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${env.XAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: options.model || 'grok-beta',
                messages: options.messages,
                ...(options.stream && { stream: options.stream }),
              }),
            });

            if (!response.ok) {
              throw new Error(`Grok API error: ${response.statusText}`);
            }

            return await response.json();
          },
        },
      },
    };
  }
  return grokClient;
}


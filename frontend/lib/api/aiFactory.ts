import { getAnthropicClient } from './anthropic';
import { getGeminiModel } from './gemini';
import { getGrokClient } from './grok';

export type AIProvider = 'claude' | 'gemini' | 'grok' | 'local';

export interface AIProviderResponse {
  content: string;
  provider: AIProvider;
}

/**
 * Call AI provider based on provider type
 */
export async function callAIProvider(
  provider: AIProvider,
  message: string,
  systemPrompt?: string
): Promise<AIProviderResponse> {
  switch (provider) {
    case 'claude': {
      const client = getAnthropicClient();
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt || '',
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      });
      const content = response.content[0];
      return {
        content: content.type === 'text' ? content.text : '',
        provider: 'claude',
      };
    }

    case 'gemini': {
      const model = getGeminiModel();
      const prompt = systemPrompt
        ? `${systemPrompt}\n\nUser: ${message}`
        : message;
      const result = await model.generateContent(prompt);
      const response = result.response;
      return {
        content: response.text(),
        provider: 'gemini',
      };
    }

    case 'grok': {
      const client = getGrokClient();
      // Grok API implementation would go here
      // For now, return a placeholder
      return {
        content: 'Grok API integration pending',
        provider: 'grok',
      };
    }

    case 'local': {
      // Call local backend (Jessica Core)
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
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


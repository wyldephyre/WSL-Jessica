/**
 * API Client with retry logic
 * Centralized API calls with automatic retry and error handling
 */

import { fetchWithRetry } from '@/lib/utils/retry';
import { env } from '@/lib/config/env';
import toast from 'react-hot-toast';

const API_BASE_URL = env.API_URL;

interface ChatRequest {
  message: string;
  provider?: string;
  mode?: string;
}

interface ChatResponse {
  response: string;
  routing?: {
    provider: string;
    tier: number;
    reason: string;
  };
  request_id?: string;
}

interface MemorySearchRequest {
  query: string;
}

interface MemorySearchResponse {
  results: Array<{
    memory: string;
    score: number;
    metadata?: any;
  }>;
  request_id?: string;
}

interface ServiceStatus {
  local_ollama: {
    available: boolean;
    response_time_ms: number | null;
    error: string | null;
  };
  local_memory: {
    available: boolean;
    response_time_ms: number | null;
    error: string | null;
  };
  claude_api: {
    configured: boolean;
  };
  grok_api: {
    configured: boolean;
  };
  gemini_api: {
    configured: boolean;
  };
  mem0_api: {
    configured: boolean;
  };
  request_id?: string;
}

/**
 * Send a chat message to Jessica with automatic retry logic
 * 
 * @param {string} message - The user's message to send to Jessica
 * @param {string} [provider='local'] - AI provider to use ('local', 'claude', 'grok', 'gemini')
 * @param {string} [mode='default'] - Conversation mode ('default', 'business', 'personal', 'creative', 'core', 'relationship')
 * @returns {Promise<ChatResponse>} Promise resolving to chat response with routing information
 * @throws {Error} If the request fails after all retries
 * 
 * @example
 * ```ts
 * const response = await sendChatMessage(
 *   "What's the weather like?",
 *   "claude",
 *   "personal"
 * );
 * console.log(response.response); // Jessica's response
 * console.log(response.routing); // Which provider was used and why
 * ```
 */
export async function sendChatMessage(
  message: string,
  provider: string = 'local',
  mode: string = 'default'
): Promise<ChatResponse> {
  const endpoint = provider === 'local' ? `${API_BASE_URL}/chat` : `${API_BASE_URL}/chat`;
  
  try {
    const response = await fetchWithRetry(
      endpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, provider, mode } as ChatRequest), // user_id no longer needed - backend uses constant
      },
      {
        maxRetries: 3,
        onRetry: (attempt, error, delay) => {
          console.log(`Retrying chat request (attempt ${attempt}): ${error.message}`);
          toast.error(`Connection issue. Retrying... (${attempt}/3)`, {
            duration: delay,
          });
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`Failed to send message: ${message}`);
    throw error;
  }
}

/**
 * Search cloud memories using Mem0 API with automatic retry logic
 * 
 * @param {string} query - Search query string
 * @returns {Promise<MemorySearchResponse>} Promise resolving to search results with scores and metadata
 * @throws {Error} If the search fails after all retries
 * 
 * @example
 * ```ts
 * const results = await searchMemory("meeting with John");
 * results.results.forEach(result => {
 *   console.log(result.memory, result.score);
 * });
 * ```
 */
export async function searchMemory(query: string): Promise<MemorySearchResponse> {
  try {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/memory/cloud/search`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query } as MemorySearchRequest),
      },
      {
        maxRetries: 2,
        onRetry: (attempt) => {
          console.log(`Retrying memory search (attempt ${attempt})`);
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Memory search error:', error);
    throw error;
  }
}

/**
 * Get health status of all Jessica services (Ollama, memory, external APIs)
 * Returns degraded status if the request fails (does not throw)
 * 
 * @returns {Promise<ServiceStatus>} Promise resolving to service health status
 * 
 * @example
 * ```ts
 * const status = await getServiceStatus();
 * if (status.local_ollama.available) {
 *   console.log(`Ollama response time: ${status.local_ollama.response_time_ms}ms`);
 * }
 * ```
 */
export async function getServiceStatus(): Promise<ServiceStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Service status error:', error);
    // Return degraded status on error
    return {
      local_ollama: { available: false, response_time_ms: null, error: 'Connection failed' },
      local_memory: { available: false, response_time_ms: null, error: 'Connection failed' },
      claude_api: { configured: false },
      grok_api: { configured: false },
      gemini_api: { configured: false },
      mem0_api: { configured: false },
    };
  }
}

/**
 * Transcribe an audio file using the backend Whisper service with retry logic
 * 
 * @param {File} audioFile - Audio file to transcribe (supports common audio formats)
 * @returns {Promise<{ transcription: string }>} Promise resolving to transcription text
 * @throws {Error} If transcription fails after all retries
 * 
 * @example
 * ```ts
 * const file = event.target.files[0];
 * const result = await transcribeAudio(file);
 * console.log(result.transcription);
 * ```
 */
export async function transcribeAudio(audioFile: File): Promise<{ transcription: string }> {
  const formData = new FormData();
  formData.append('audio', audioFile);

  try {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/transcribe`,
      {
        method: 'POST',
        body: formData,
      },
      {
        maxRetries: 2,
        onRetry: (attempt, error, delay) => {
          toast.error(`Transcription retry ${attempt}/2`, { duration: delay });
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Transcription failed');
    }

    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    toast.error(`Transcription failed: ${message}`);
    throw error;
  }
}


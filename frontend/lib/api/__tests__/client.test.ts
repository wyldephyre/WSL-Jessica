/**
 * Tests for API client
 */

import { sendChatMessage, searchMemory, getServiceStatus, transcribeAudio } from '../client';
import { fetchWithRetry } from '../../utils/retry';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../../utils/retry');
jest.mock('react-hot-toast');

describe('API Client', () => {
  const mockFetchWithRetry = fetchWithRetry as jest.MockedFunction<typeof fetchWithRetry>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendChatMessage', () => {
    it('should send a chat message successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          response: 'Hello!',
          routing: { provider: 'local', tier: 1, reason: 'Default' },
          request_id: '123',
        }),
      };

      mockFetchWithRetry.mockResolvedValueOnce(mockResponse as any);

      const result = await sendChatMessage('Hello', 'local');

      expect(result).toEqual({
        response: 'Hello!',
        routing: { provider: 'local', tier: 1, reason: 'Default' },
        request_id: '123',
      });

      expect(mockFetchWithRetry).toHaveBeenCalledWith(
        expect.stringContaining('/chat'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Hello', provider: 'local', mode: 'default' }),
        }),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      };

      mockFetchWithRetry.mockResolvedValueOnce(mockResponse as any);

      await expect(sendChatMessage('Hello')).rejects.toThrow('Server error');
      expect(toast.error).toHaveBeenCalled();
    });

    it('should use custom provider and mode', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ response: 'Response' }),
      };

      mockFetchWithRetry.mockResolvedValueOnce(mockResponse as any);

      await sendChatMessage('Test', 'claude', 'business');

      expect(mockFetchWithRetry).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ message: 'Test', provider: 'claude', mode: 'business' }),
        }),
        expect.any(Object)
      );
    });

    it('should show retry toast on retry', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ response: 'Success' }),
      };

      mockFetchWithRetry.mockImplementation(async (url, options, retryOptions) => {
        // Simulate a retry
        if (retryOptions?.onRetry) {
          retryOptions.onRetry(1, new Error('Test'), 1000);
        }
        return mockResponse as any;
      });

      await sendChatMessage('Test');

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Retrying'),
        expect.any(Object)
      );
    });
  });

  describe('searchMemory', () => {
    it('should search memory successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          results: [{ memory: 'Test memory', score: 0.9 }],
          request_id: '456',
        }),
      };

      mockFetchWithRetry.mockResolvedValueOnce(mockResponse as any);

      const result = await searchMemory('test query');

      expect(result).toEqual({
        results: [{ memory: 'Test memory', score: 0.9 }],
        request_id: '456',
      });

      expect(mockFetchWithRetry).toHaveBeenCalledWith(
        expect.stringContaining('/memory/cloud/search'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ query: 'test query' }),
        }),
        expect.any(Object)
      );
    });

    it('should handle memory search errors', async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({ error: 'Search failed' }),
      };

      mockFetchWithRetry.mockResolvedValueOnce(mockResponse as any);

      await expect(searchMemory('test')).rejects.toThrow();
    });
  });

  describe('getServiceStatus', () => {
    it('should get service status successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          local_ollama: { available: true, response_time_ms: 50, error: null },
          local_memory: { available: true, response_time_ms: 30, error: null },
          claude_api: { configured: true },
          grok_api: { configured: true },
          gemini_api: { configured: true },
          letta_api: { configured: true },
          mem0_api: { configured: true }, // Deprecated
        }),
      };

      global.fetch = jest.fn().mockResolvedValueOnce(mockResponse as any);

      const result = await getServiceStatus();

      expect(result.local_ollama.available).toBe(true);
      expect(result.claude_api.configured).toBe(true);
    });

    it('should return degraded status on error', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Connection failed'));

      const result = await getServiceStatus();

      expect(result.local_ollama.available).toBe(false);
      expect(result.local_ollama.error).toBe('Connection failed');
    });
  });

  describe('transcribeAudio', () => {
    it('should transcribe audio successfully', async () => {
      const mockFile = new File(['audio data'], 'test.mp3', { type: 'audio/mp3' });
      const mockResponse = {
        ok: true,
        json: async () => ({ transcription: 'Hello world' }),
      };

      mockFetchWithRetry.mockResolvedValueOnce(mockResponse as any);

      const result = await transcribeAudio(mockFile);

      expect(result).toEqual({ transcription: 'Hello world' });
      expect(mockFetchWithRetry).toHaveBeenCalledWith(
        expect.stringContaining('/transcribe'),
        expect.objectContaining({
          method: 'POST',
        }),
        expect.any(Object)
      );
    });

    it('should handle transcription errors', async () => {
      const mockFile = new File(['audio data'], 'test.mp3', { type: 'audio/mp3' });
      const mockResponse = {
        ok: false,
        json: async () => ({ error: 'Transcription failed' }),
      };

      mockFetchWithRetry.mockResolvedValueOnce(mockResponse as any);

      await expect(transcribeAudio(mockFile)).rejects.toThrow();
      expect(toast.error).toHaveBeenCalled();
    });
  });
});


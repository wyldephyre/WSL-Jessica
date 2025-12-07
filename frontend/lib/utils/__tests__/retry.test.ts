/**
 * Tests for retry utility
 */

import { fetchWithRetry, retryAsync, isRetryableError } from '../retry';

// Mock fetch globally
global.fetch = jest.fn();

describe('retry utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('fetchWithRetry', () => {
    it('should return response on first try if successful', async () => {
      const mockResponse = { ok: true, json: async () => ({ data: 'test' }) };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const promise = fetchWithRetry('http://test.com');
      const response = await promise;

      expect(response).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable status codes', async () => {
      const failResponse = { ok: false, status: 503, statusText: 'Service Unavailable' };
      const successResponse = { ok: true, json: async () => ({ data: 'test' }) };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(failResponse)
        .mockResolvedValueOnce(successResponse);

      const promise = fetchWithRetry('http://test.com', undefined, { maxRetries: 3 });

      // Fast-forward through the retry delay
      jest.advanceTimersByTime(1000);
      
      const response = await promise;

      expect(response).toBe(successResponse);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should call onRetry callback on retry', async () => {
      const onRetry = jest.fn();
      const failResponse = { ok: false, status: 500, statusText: 'Error' };
      const successResponse = { ok: true };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(failResponse)
        .mockResolvedValueOnce(successResponse);

      const promise = fetchWithRetry('http://test.com', undefined, {
        maxRetries: 1,
        onRetry,
      });

      jest.advanceTimersByTime(1000);
      await promise;

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number));
    });

    it('should throw after max retries', async () => {
      const failResponse = { ok: false, status: 500, statusText: 'Error' };

      (global.fetch as jest.Mock).mockResolvedValue(failResponse);

      const promise = fetchWithRetry('http://test.com', undefined, { maxRetries: 2 });

      jest.advanceTimersByTime(10000);

      await expect(promise).resolves.toBe(failResponse);
      expect(global.fetch).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('should not retry on non-retryable status codes', async () => {
      const failResponse = { ok: false, status: 404, statusText: 'Not Found' };

      (global.fetch as jest.Mock).mockResolvedValueOnce(failResponse);

      const response = await fetchWithRetry('http://test.com');

      expect(response).toBe(failResponse);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should use exponential backoff', async () => {
      const failResponse = { ok: false, status: 503, statusText: 'Error' };
      const successResponse = { ok: true };
      const onRetry = jest.fn();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(failResponse)
        .mockResolvedValueOnce(failResponse)
        .mockResolvedValueOnce(successResponse);

      const promise = fetchWithRetry('http://test.com', undefined, {
        maxRetries: 3,
        initialDelay: 100,
        exponentialBase: 2,
        onRetry,
      });

      jest.advanceTimersByTime(100); // First retry after 100ms
      jest.advanceTimersByTime(200); // Second retry after 200ms (100 * 2)
      
      await promise;

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error), 100);
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error), 200);
    });
  });

  describe('retryAsync', () => {
    it('should retry a function on failure', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockResolvedValueOnce('Success');

      const promise = retryAsync(mockFn, { maxRetries: 2 });
      
      jest.advanceTimersByTime(1000);
      
      const result = await promise;

      expect(result).toBe('Success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Always fails'));

      const promise = retryAsync(mockFn, { maxRetries: 2 });
      
      jest.advanceTimersByTime(10000);

      await expect(promise).rejects.toThrow('Always fails');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should return value on first try if successful', async () => {
      const mockFn = jest.fn().mockResolvedValue('Success');

      const result = await retryAsync(mockFn);

      expect(result).toBe('Success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('isRetryableError', () => {
    it('should identify network errors as retryable', () => {
      const networkError = new TypeError('Failed to fetch');
      expect(isRetryableError(networkError)).toBe(true);
    });

    it('should identify timeout errors as retryable', () => {
      const timeoutError = new Error('Request timeout');
      expect(isRetryableError(timeoutError)).toBe(true);
    });

    it('should identify connection errors as retryable', () => {
      const connError = new Error('Network connection lost');
      expect(isRetryableError(connError)).toBe(true);
    });

    it('should not identify generic errors as retryable', () => {
      const genericError = new Error('Something went wrong');
      expect(isRetryableError(genericError)).toBe(false);
    });

    it('should handle non-Error objects', () => {
      expect(isRetryableError('string error')).toBe(false);
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });
});


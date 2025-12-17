/**
 * Retry helpers with exponential backoff.
 * 
 * @template T - The return type of the function being retried
 * @param {() => Promise<T>} fn - The async function to retry
 * @param {number} [retries=3] - Maximum number of retry attempts
 * @param {number} [delay=1000] - Initial delay in milliseconds before first retry
 * @param {number} [backoff=2] - Backoff multiplier (delay doubles each retry)
 * @returns {Promise<T>} The result of the function if successful
 * @throws {Error} The last error thrown if all retries are exhausted
 * 
 * @example
 * ```ts
 * const result = await retry(
 *   () => fetch('/api/data'),
 *   3,  // 3 retries
 *   1000,  // Start with 1 second delay
 *   2  // Double delay each time (1s, 2s, 4s)
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  backoff: number = 2
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * backoff, backoff);
  }
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  exponentialBase?: number;
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = (error.message || '').toLowerCase();
  // Browser/node-fetch commonly throw TypeError for network failures.
  if (error instanceof TypeError) return true;
  if (msg.includes('timeout')) return true;
  if (msg.includes('network')) return true;
  if (msg.includes('connection')) return true;
  return false;
}

export async function retryAsync<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelay = options.initialDelay ?? 1000;
  const exponentialBase = options.exponentialBase ?? 2;

  // Pre-schedule sleeps so fake-timer tests can advance time immediately.
  const sleepPromises: Array<Promise<void>> = [];
  for (let i = 1; i <= maxRetries; i++) {
    const delayMs = initialDelay * Math.pow(exponentialBase, i - 1);
    sleepPromises[i] = new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  let attempt = 0;
  // attempt = 0 is the initial call, retries are 1..maxRetries
  // total calls = 1 + maxRetries
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (attempt >= maxRetries) {
        throw error;
      }
      attempt += 1;
      const delayMs = initialDelay * Math.pow(exponentialBase, attempt - 1);
      options.onRetry?.(attempt, error, delayMs);
      await sleepPromises[attempt];
    }
  }
}

function isRetryableStatus(status: number): boolean {
  // Retry on transient/server errors.
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  const maxRetries = options.maxRetries ?? 2;
  const initialDelay = options.initialDelay ?? 1000;
  const exponentialBase = options.exponentialBase ?? 2;

  // Pre-schedule sleeps so callers using fake timers can advance immediately.
  const sleepPromises: Array<Promise<void>> = [];
  for (let i = 1; i <= maxRetries; i++) {
    const delayMs = initialDelay * Math.pow(exponentialBase, i - 1);
    sleepPromises[i] = new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  let attempt = 0;
  let lastResponse: Response | null = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(input, init);
      lastResponse = res;

      if (res.ok) return res;
      if (!isRetryableStatus((res as any).status) || attempt >= maxRetries) {
        return res;
      }

      attempt += 1;
      const delayMs = initialDelay * Math.pow(exponentialBase, attempt - 1);
      options.onRetry?.(attempt, new Error(`HTTP ${(res as any).status}: ${(res as any).statusText || ''}`), delayMs);
      await sleepPromises[attempt];
      continue;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (!isRetryableError(error) || attempt >= maxRetries) {
        // If we have a last HTTP response, return it; otherwise throw.
        if (lastResponse) return lastResponse;
        throw error;
      }
      attempt += 1;
      const delayMs = initialDelay * Math.pow(exponentialBase, attempt - 1);
      options.onRetry?.(attempt, error, delayMs);
      await sleepPromises[attempt];
    }
  }
}

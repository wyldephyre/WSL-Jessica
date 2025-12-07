/**
 * Retry a function with exponential backoff
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

/**
 * Retry helpers for inline subsystems (messaging deliveries, automation actions,
 * export jobs). Uses exponential backoff with jitter. Separate from the durable
 * queue — use this when you want to retry in-process before giving up and
 * enqueuing for later.
 */

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Multiplier applied per attempt (2 = exponential). */
  factor?: number;
  /** Return true to skip retry for a given error. */
  shouldRetry?: (err: unknown) => boolean;
}

export const DEFAULT_RETRY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 250,
  maxDelayMs: 5_000,
  factor: 2,
};

function jittered(ms: number): number {
  // Full jitter — uniform in [0, ms]
  return Math.floor(Math.random() * Math.max(1, ms));
}

export function computeBackoffMs(attempt: number, policy: RetryPolicy = DEFAULT_RETRY): number {
  const factor = policy.factor ?? 2;
  const raw = Math.min(policy.maxDelayMs, policy.baseDelayMs * Math.pow(factor, attempt - 1));
  return jittered(raw);
}

export interface WithRetryResult<T> {
  value: T;
  attempts: number;
}

/**
 * Run `fn` with retry. Throws the last error if all attempts fail. Note:
 * this sleeps inside the caller's process — don't use it for long waits.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY,
): Promise<WithRetryResult<T>> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      const value = await fn();
      return { value, attempts: attempt };
    } catch (err) {
      lastErr = err;
      if (policy.shouldRetry && !policy.shouldRetry(err)) throw err;
      if (attempt >= policy.maxAttempts) break;
      const delay = computeBackoffMs(attempt, policy);
      await sleep(delay);
    }
  }
  throw lastErr;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry helpers for inline subsystems (messaging deliveries, automation actions,
 * export jobs). Uses exponential backoff with jitter. Separate from the durable
 * queue — use this when you want to retry in-process before giving up and
 * enqueuing for later.
 */
export const DEFAULT_RETRY = {
    maxAttempts: 3,
    baseDelayMs: 250,
    maxDelayMs: 5000,
    factor: 2,
};
function jittered(ms) {
    // Full jitter — uniform in [0, ms]
    return Math.floor(Math.random() * Math.max(1, ms));
}
export function computeBackoffMs(attempt, policy = DEFAULT_RETRY) {
    var _a;
    const factor = (_a = policy.factor) !== null && _a !== void 0 ? _a : 2;
    const raw = Math.min(policy.maxDelayMs, policy.baseDelayMs * Math.pow(factor, attempt - 1));
    return jittered(raw);
}
/**
 * Run `fn` with retry. Throws the last error if all attempts fail. Note:
 * this sleeps inside the caller's process — don't use it for long waits.
 */
export async function withRetry(fn, policy = DEFAULT_RETRY) {
    let lastErr;
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
        try {
            const value = await fn();
            return { value, attempts: attempt };
        }
        catch (err) {
            lastErr = err;
            if (policy.shouldRetry && !policy.shouldRetry(err))
                throw err;
            if (attempt >= policy.maxAttempts)
                break;
            const delay = computeBackoffMs(attempt, policy);
            await sleep(delay);
        }
    }
    throw lastErr;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

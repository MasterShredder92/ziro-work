/**
 * In-memory sliding-window rate limiter.
 *
 * Keyed by an arbitrary string (tenant, ip, "tenant:ip", etc). Safe across
 * hot modules via a globalThis bag. Works per-serverless-instance only —
 * the DB-backed audit trail in `rate_limit_hits` is the durable record.
 *
 * For a distributed counter, swap `incrementLocal` for Upstash/Redis later.
 */
const g = globalThis;
function getBuckets() {
    if (!g.__ziro_ratelimit_buckets)
        g.__ziro_ratelimit_buckets = new Map();
    return g.__ziro_ratelimit_buckets;
}
export function checkLimit(key, policy, now = Date.now()) {
    var _a;
    const buckets = getBuckets();
    let bucket = buckets.get(key);
    if (!bucket) {
        bucket = { timestamps: [] };
        buckets.set(key, bucket);
    }
    const windowStart = now - policy.windowMs;
    while (bucket.timestamps.length && bucket.timestamps[0] < windowStart) {
        bucket.timestamps.shift();
    }
    const allowed = bucket.timestamps.length < policy.max;
    if (allowed)
        bucket.timestamps.push(now);
    const earliest = (_a = bucket.timestamps[0]) !== null && _a !== void 0 ? _a : now;
    const resetAt = earliest + policy.windowMs;
    const remaining = Math.max(0, policy.max - bucket.timestamps.length);
    return {
        ok: allowed,
        remaining,
        resetAt,
        limit: policy.max,
        windowMs: policy.windowMs,
    };
}
/** Force-peek without consuming a token (for telemetry). */
export function peekLimit(key, policy, now = Date.now()) {
    var _a;
    const buckets = getBuckets();
    const bucket = buckets.get(key);
    const timestamps = bucket ? bucket.timestamps.filter((t) => t >= now - policy.windowMs) : [];
    const remaining = Math.max(0, policy.max - timestamps.length);
    const earliest = (_a = timestamps[0]) !== null && _a !== void 0 ? _a : now;
    return {
        ok: remaining > 0,
        remaining,
        resetAt: earliest + policy.windowMs,
        limit: policy.max,
        windowMs: policy.windowMs,
    };
}
export function resetLimit(key) {
    getBuckets().delete(key);
}
/** Composite key helpers. */
export function ipKey(policyId, ip) {
    return `ip:${policyId}:${ip}`;
}
export function tenantKey(policyId, tenantId) {
    return `tenant:${policyId}:${tenantId}`;
}
export function tenantIpKey(policyId, tenantId, ip) {
    return `tenant+ip:${policyId}:${tenantId}:${ip}`;
}

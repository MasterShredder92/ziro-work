/**
 * In-memory sliding-window rate limiter.
 *
 * Keyed by an arbitrary string (tenant, ip, "tenant:ip", etc). Safe across
 * hot modules via a globalThis bag. Works per-serverless-instance only —
 * the DB-backed audit trail in `rate_limit_hits` is the durable record.
 *
 * For a distributed counter, swap `incrementLocal` for Upstash/Redis later.
 */

export interface LimiterPolicy {
  /** Human id (matches policy name in policies.ts). */
  id: string;
  /** Max events allowed in `windowMs`. */
  max: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

export interface LimiterDecision {
  ok: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  windowMs: number;
}

type Bucket = {
  timestamps: number[];
};

type GlobalWithBuckets = typeof globalThis & {
  __ziro_ratelimit_buckets?: Map<string, Bucket>;
};

const g = globalThis as GlobalWithBuckets;

function getBuckets(): Map<string, Bucket> {
  if (!g.__ziro_ratelimit_buckets) g.__ziro_ratelimit_buckets = new Map();
  return g.__ziro_ratelimit_buckets;
}

export function checkLimit(
  key: string,
  policy: LimiterPolicy,
  now: number = Date.now(),
): LimiterDecision {
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
  if (allowed) bucket.timestamps.push(now);

  const earliest = bucket.timestamps[0] ?? now;
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
export function peekLimit(
  key: string,
  policy: LimiterPolicy,
  now: number = Date.now(),
): LimiterDecision {
  const buckets = getBuckets();
  const bucket = buckets.get(key);
  const timestamps = bucket ? bucket.timestamps.filter((t) => t >= now - policy.windowMs) : [];
  const remaining = Math.max(0, policy.max - timestamps.length);
  const earliest = timestamps[0] ?? now;
  return {
    ok: remaining > 0,
    remaining,
    resetAt: earliest + policy.windowMs,
    limit: policy.max,
    windowMs: policy.windowMs,
  };
}

export function resetLimit(key: string): void {
  getBuckets().delete(key);
}

/** Composite key helpers. */
export function ipKey(policyId: string, ip: string): string {
  return `ip:${policyId}:${ip}`;
}
export function tenantKey(policyId: string, tenantId: string): string {
  return `tenant:${policyId}:${tenantId}`;
}
export function tenantIpKey(policyId: string, tenantId: string, ip: string): string {
  return `tenant+ip:${policyId}:${tenantId}:${ip}`;
}

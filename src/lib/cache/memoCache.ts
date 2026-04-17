/**
 * Lightweight TTL + single-flight cache for server-side reads.
 *
 * - `get(key)` — returns the fresh entry or undefined
 * - `set(key, value, ttlMs)` — stores for ttlMs
 * - `cached(key, ttlMs, loader)` — returns a cached value or calls the loader;
 *   concurrent callers for the same key share the in-flight promise.
 * - `invalidate(key | predicate)` — purges entries by exact key or filter
 *
 * Per-serverless-instance only. No cross-region coherence. For strong
 * consistency, invalidate explicitly after writes at the call site.
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

type GlobalCacheBag = typeof globalThis & {
  __ziro_memo_cache?: Map<string, CacheEntry<unknown>>;
  __ziro_memo_inflight?: Map<string, Promise<unknown>>;
};

const g = globalThis as GlobalCacheBag;

function getStore(): Map<string, CacheEntry<unknown>> {
  if (!g.__ziro_memo_cache) g.__ziro_memo_cache = new Map();
  return g.__ziro_memo_cache;
}

function getInflight(): Map<string, Promise<unknown>> {
  if (!g.__ziro_memo_inflight) g.__ziro_memo_inflight = new Map();
  return g.__ziro_memo_inflight;
}

export function get<T>(key: string, now: number = Date.now()): T | undefined {
  const entry = getStore().get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (entry.expiresAt <= now) {
    getStore().delete(key);
    return undefined;
  }
  return entry.value;
}

export function set<T>(key: string, value: T, ttlMs: number, now: number = Date.now()): void {
  getStore().set(key, { value, expiresAt: now + ttlMs });
}

export function invalidate(keyOrPredicate: string | ((key: string) => boolean)): number {
  const store = getStore();
  if (typeof keyOrPredicate === "string") {
    return store.delete(keyOrPredicate) ? 1 : 0;
  }
  let removed = 0;
  for (const k of Array.from(store.keys())) {
    if (keyOrPredicate(k)) {
      store.delete(k);
      removed += 1;
    }
  }
  return removed;
}

export function clear(): void {
  getStore().clear();
}

export interface CachedOptions {
  ttlMs: number;
  /** When true, a pending loader will also be evicted alongside the stored value on invalidation. */
  dedupeInflight?: boolean;
}

export async function cached<T>(
  key: string,
  loader: () => Promise<T>,
  options: CachedOptions,
): Promise<T> {
  const hit = get<T>(key);
  if (hit !== undefined) return hit;

  const inflight = getInflight();
  if (options.dedupeInflight !== false) {
    const existing = inflight.get(key) as Promise<T> | undefined;
    if (existing) return existing;
  }

  const promise = (async () => {
    try {
      const value = await loader();
      set(key, value, options.ttlMs);
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  if (options.dedupeInflight !== false) inflight.set(key, promise);
  return promise;
}

/** Debug helper — snapshot the current cache size & keys. */
export function inspect(): { size: number; keys: string[] } {
  const store = getStore();
  return { size: store.size, keys: Array.from(store.keys()) };
}

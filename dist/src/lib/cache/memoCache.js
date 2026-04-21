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
const g = globalThis;
function getStore() {
    if (!g.__ziro_memo_cache)
        g.__ziro_memo_cache = new Map();
    return g.__ziro_memo_cache;
}
function getInflight() {
    if (!g.__ziro_memo_inflight)
        g.__ziro_memo_inflight = new Map();
    return g.__ziro_memo_inflight;
}
export function get(key, now = Date.now()) {
    const entry = getStore().get(key);
    if (!entry)
        return undefined;
    if (entry.expiresAt <= now) {
        getStore().delete(key);
        return undefined;
    }
    return entry.value;
}
export function set(key, value, ttlMs, now = Date.now()) {
    getStore().set(key, { value, expiresAt: now + ttlMs });
}
export function invalidate(keyOrPredicate) {
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
export function clear() {
    getStore().clear();
}
export async function cached(key, loader, options) {
    const hit = get(key);
    if (hit !== undefined)
        return hit;
    const inflight = getInflight();
    if (options.dedupeInflight !== false) {
        const existing = inflight.get(key);
        if (existing)
            return existing;
    }
    const promise = (async () => {
        try {
            const value = await loader();
            set(key, value, options.ttlMs);
            return value;
        }
        finally {
            inflight.delete(key);
        }
    })();
    if (options.dedupeInflight !== false)
        inflight.set(key, promise);
    return promise;
}
/** Debug helper — snapshot the current cache size & keys. */
export function inspect() {
    const store = getStore();
    return { size: store.size, keys: Array.from(store.keys()) };
}

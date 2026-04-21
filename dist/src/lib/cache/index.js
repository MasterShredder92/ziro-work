import { cached, invalidate, set, get } from "./memoCache";
import { CacheNamespace, keyFor, matchesScope } from "./keys";
export { cached, invalidate, set, get, clear, inspect } from "./memoCache";
export { CacheNamespace, keyFor, matchesScope, namespacePrefix } from "./keys";
/** Default TTLs, tuned for the scale of surfaces in this app. Override per call. */
export const DEFAULT_TTL = {
    crm: 30000,
    template: 60000,
    progress: 15000,
    assessment: 30000,
    schedule: 10000,
};
/**
 * Sugar for subsystem caches. Call sites get a dedicated object so they
 * never have to stringify keys themselves.
 */
export function subsystemCache(namespace, defaultTtlMs) {
    return {
        get(tenantId, kind, ...params) {
            return get(keyFor(namespace, tenantId, kind, ...params));
        },
        set(tenantId, kind, value, ttlMs, ...params) {
            set(keyFor(namespace, tenantId, kind, ...params), value, ttlMs !== null && ttlMs !== void 0 ? ttlMs : defaultTtlMs);
        },
        cached(tenantId, kind, loader, options) {
            var _a, _b;
            const params = (_a = options === null || options === void 0 ? void 0 : options.params) !== null && _a !== void 0 ? _a : [];
            return cached(keyFor(namespace, tenantId, kind, ...params), loader, {
                ttlMs: (_b = options === null || options === void 0 ? void 0 : options.ttlMs) !== null && _b !== void 0 ? _b : defaultTtlMs,
            });
        },
        invalidate(tenantId, kind) {
            if (!kind) {
                return invalidate((k) => matchesScope(k, namespace, tenantId));
            }
            const prefix = `${namespace}:${tenantId.replace(/[:\s]+/g, "_")}:${kind.replace(/[:\s]+/g, "_")}`;
            return invalidate((k) => k.startsWith(prefix));
        },
        invalidateAll() {
            return invalidate((k) => k.startsWith(`${namespace}:`));
        },
    };
}
export const crmCache = subsystemCache(CacheNamespace.CRM, DEFAULT_TTL.crm);
export const templateCache = subsystemCache(CacheNamespace.TEMPLATE, DEFAULT_TTL.template);
export const progressCache = subsystemCache(CacheNamespace.PROGRESS, DEFAULT_TTL.progress);
export const assessmentCache = subsystemCache(CacheNamespace.ASSESSMENT, DEFAULT_TTL.assessment);
export const scheduleCache = subsystemCache(CacheNamespace.SCHEDULE, DEFAULT_TTL.schedule);
/** Invalidate every subsystem cache for a given tenant — call from destructive admin operations. */
export function invalidateTenant(tenantId) {
    return (crmCache.invalidate(tenantId) +
        templateCache.invalidate(tenantId) +
        progressCache.invalidate(tenantId) +
        assessmentCache.invalidate(tenantId) +
        scheduleCache.invalidate(tenantId));
}

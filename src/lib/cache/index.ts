import { cached, invalidate, set, get, clear, inspect } from "./memoCache";
import { CacheNamespace, keyFor, matchesScope, namespacePrefix } from "./keys";
import type { CacheNamespaceValue } from "./keys";

export { cached, invalidate, set, get, clear, inspect } from "./memoCache";
export { CacheNamespace, keyFor, matchesScope, namespacePrefix } from "./keys";
export type { CacheNamespaceValue } from "./keys";

/** Default TTLs, tuned for the scale of surfaces in this app. Override per call. */
export const DEFAULT_TTL = {
  crm: 30_000,
  template: 60_000,
  progress: 15_000,
  assessment: 30_000,
  schedule: 10_000,
} as const;

/**
 * Sugar for subsystem caches. Call sites get a dedicated object so they
 * never have to stringify keys themselves.
 */
export function subsystemCache(namespace: CacheNamespaceValue, defaultTtlMs: number) {
  return {
    get<T>(tenantId: string, kind: string, ...params: Array<string | number | null | undefined>) {
      return get<T>(keyFor(namespace, tenantId, kind, ...params));
    },
    set<T>(
      tenantId: string,
      kind: string,
      value: T,
      ttlMs: number | undefined,
      ...params: Array<string | number | null | undefined>
    ) {
      set(keyFor(namespace, tenantId, kind, ...params), value, ttlMs ?? defaultTtlMs);
    },
    cached<T>(
      tenantId: string,
      kind: string,
      loader: () => Promise<T>,
      options?: { ttlMs?: number; params?: Array<string | number | null | undefined> },
    ) {
      const params = options?.params ?? [];
      return cached(keyFor(namespace, tenantId, kind, ...params), loader, {
        ttlMs: options?.ttlMs ?? defaultTtlMs,
      });
    },
    invalidate(tenantId: string, kind?: string) {
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
export function invalidateTenant(tenantId: string): number {
  return (
    crmCache.invalidate(tenantId) +
    templateCache.invalidate(tenantId) +
    progressCache.invalidate(tenantId) +
    assessmentCache.invalidate(tenantId) +
    scheduleCache.invalidate(tenantId)
  );
}

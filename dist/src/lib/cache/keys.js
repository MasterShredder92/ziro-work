/**
 * Canonical cache-key builders. Centralizing these makes it easier to
 * invalidate whole families (e.g. every CRM lookup for a tenant) without
 * chasing string literals across the codebase.
 *
 * Convention:  "<namespace>:<tenantId>:<kind>[:<param>[:<param>]]"
 */
export const CacheNamespace = {
    CRM: "crm",
    TEMPLATE: "tpl",
    PROGRESS: "prog",
    ASSESSMENT: "assess",
    SCHEDULE: "sched",
};
function safe(part) {
    if (!part)
        return "_";
    return String(part).replace(/[:\s]+/g, "_");
}
export function keyFor(namespace, tenantId, kind, ...params) {
    const base = `${namespace}:${safe(tenantId)}:${safe(kind)}`;
    if (params.length === 0)
        return base;
    const tail = params.map((p) => safe(p == null ? "_" : String(p))).join(":");
    return `${base}:${tail}`;
}
export function namespacePrefix(namespace, tenantId) {
    return `${namespace}:${safe(tenantId)}:`;
}
/** Invalidate every cache entry for a given (namespace, tenant) scope. */
export function matchesScope(key, namespace, tenantId) {
    return key.startsWith(namespacePrefix(namespace, tenantId));
}

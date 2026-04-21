function normalizeTenantId(v) {
    if (typeof v !== "string")
        return null;
    const s = v.trim();
    return s.length ? s : null;
}
async function readTenantIdFromHeaders() {
    // Only works in Next.js server contexts; safe no-op elsewhere.
    if (typeof window !== "undefined")
        return null;
    try {
        const mod = (await import("next/headers"));
        return normalizeTenantId(mod.headers().get("x-tenant-id"));
    }
    catch (_a) {
        return null;
    }
}
function readTenantIdFromUrl() {
    try {
        const loc = globalThis
            .location;
        const href = typeof (loc === null || loc === void 0 ? void 0 : loc.href) === "string"
            ? loc.href
            : typeof (loc === null || loc === void 0 ? void 0 : loc.search) === "string"
                ? `http://local${loc.search}`
                : null;
        if (!href)
            return null;
        const url = new URL(href);
        return normalizeTenantId(url.searchParams.get("tenantId"));
    }
    catch (_a) {
        return null;
    }
}
function readTenantIdFromAgentContext() {
    var _a;
    const g = globalThis;
    const candidates = [
        g.__agentContext,
        g.agentContext,
        g.__ctx,
        g.ctx,
    ];
    for (const c of candidates) {
        if (!c || typeof c !== "object")
            continue;
        const tenantId = (_a = c.tenantId) !== null && _a !== void 0 ? _a : c.tenant_id;
        const norm = normalizeTenantId(tenantId);
        if (norm)
            return norm;
    }
    return null;
}
export async function getTenantContext(input) {
    const fromInput = normalizeTenantId(input === null || input === void 0 ? void 0 : input.tenantId);
    if (fromInput)
        return { tenantId: fromInput };
    const fromHeaders = await readTenantIdFromHeaders();
    if (fromHeaders)
        return { tenantId: fromHeaders };
    const fromUrl = readTenantIdFromUrl();
    if (fromUrl)
        return { tenantId: fromUrl };
    const fromAgent = readTenantIdFromAgentContext();
    if (fromAgent)
        return { tenantId: fromAgent };
    return { tenantId: null };
}

import { NextResponse } from "next/server";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { getServiceClient } from "@/lib/supabase";
export function resolveTenantId(req) {
    const headerTenant = req.headers.get("x-tenant-id");
    if (headerTenant && headerTenant.trim().length > 0)
        return headerTenant.trim();
    const url = new URL(req.url);
    const queryTenant = url.searchParams.get("tenantId");
    if (queryTenant && queryTenant.trim().length > 0)
        return queryTenant.trim();
    return DEFAULT_TENANT_ID;
}
const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function resolveTenantIdBySlugOrId(slugOrId) {
    const value = (slugOrId !== null && slugOrId !== void 0 ? slugOrId : "").trim();
    if (!value)
        return null;
    if (UUID_LIKE.test(value))
        return value;
    const service = getServiceClient();
    const { data, error } = await service
        .from("tenants")
        .select("id")
        .eq("slug", value)
        .maybeSingle();
    if (error || !(data === null || data === void 0 ? void 0 : data.id))
        return null;
    return String(data.id);
}
export async function resolveTenantIdFromRequest(req) {
    var _a, _b, _c, _d;
    const headerTenantId = req.headers.get("x-tenant-id");
    const headerTenantSlug = req.headers.get("x-tenant-slug");
    const url = new URL(req.url);
    const queryTenantId = url.searchParams.get("tenantId");
    const queryTenantSlug = (_a = url.searchParams.get("tenantSlug")) !== null && _a !== void 0 ? _a : url.searchParams.get("tenant");
    const resolved = (_d = (_c = (_b = (await resolveTenantIdBySlugOrId(headerTenantId))) !== null && _b !== void 0 ? _b : (await resolveTenantIdBySlugOrId(headerTenantSlug))) !== null && _c !== void 0 ? _c : (await resolveTenantIdBySlugOrId(queryTenantId))) !== null && _d !== void 0 ? _d : (await resolveTenantIdBySlugOrId(queryTenantSlug));
    return resolved !== null && resolved !== void 0 ? resolved : DEFAULT_TENANT_ID;
}
export function parseListQuery(req) {
    const url = new URL(req.url);
    const out = {};
    const limit = url.searchParams.get("limit");
    const offset = url.searchParams.get("offset");
    const orderBy = url.searchParams.get("orderBy");
    const order = url.searchParams.get("order");
    if (limit) {
        const n = Number(limit);
        if (Number.isFinite(n) && n > 0)
            out.limit = Math.min(n, 1000);
    }
    if (offset) {
        const n = Number(offset);
        if (Number.isFinite(n) && n >= 0)
            out.offset = n;
    }
    if (orderBy)
        out.orderBy = orderBy;
    if (order)
        out.ascending = order.toLowerCase() === "asc";
    return out;
}
export async function readJson(req) {
    try {
        return (await req.json());
    }
    catch (_a) {
        return null;
    }
}
export function ok(data, init) {
    return NextResponse.json(data, init);
}
export function created(data) {
    return NextResponse.json(data, { status: 201 });
}
export function noContent() {
    return new NextResponse(null, { status: 204 });
}
export function badRequest(error, details) {
    const body = { error };
    if (details !== undefined)
        body.details = details;
    return NextResponse.json(body, { status: 400, headers: { "Cache-Control": "no-store" } });
}
export function notFound(error = "Not found") {
    return NextResponse.json({ error }, { status: 404, headers: { "Cache-Control": "no-store" } });
}
export function tooManyRequests(error = "Too many requests", options) {
    const body = { error, code: "RATE_LIMITED" };
    if ((options === null || options === void 0 ? void 0 : options.details) !== undefined)
        body.details = options.details;
    const retryAfter = options === null || options === void 0 ? void 0 : options.retryAfterSeconds;
    return NextResponse.json(body, {
        status: 429,
        headers: Object.assign({ "Cache-Control": "no-store" }, (retryAfter && retryAfter > 0 ? { "Retry-After": String(Math.ceil(retryAfter)) } : {})),
    });
}
export function serverError(err) {
    const message = err instanceof Error ? err.message : typeof err === "string" ? err : "Internal error";
    const code = err && typeof err === "object" && "code" in err
        ? String(err.code)
        : undefined;
    const body = { error: message };
    if (code)
        body.code = code;
    return NextResponse.json(body, { status: 500, headers: { "Cache-Control": "no-store" } });
}
export function serializeError(err) {
    if (err instanceof Error) {
        const maybe = err;
        return {
            error: err.message,
            code: maybe.code,
            details: maybe.details,
        };
    }
    return { error: typeof err === "string" ? err : "Unknown error" };
}

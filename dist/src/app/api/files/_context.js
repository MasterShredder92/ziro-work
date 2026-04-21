import "server-only";
import { NextResponse } from "next/server";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { buildContextFromSession, } from "@/lib/files/service";
export async function resolveFilesApiContext(req, options) {
    var _a, _b;
    const session = await getSession();
    if (!session)
        throw new Error("UNAUTHENTICATED");
    let scope = "files.read";
    if (options === null || options === void 0 ? void 0 : options.requireWrite)
        scope = "files.write";
    else if (options === null || options === void 0 ? void 0 : options.requireShare)
        scope = "files.share";
    else if (options === null || options === void 0 ? void 0 : options.requireSign)
        scope = "files.sign";
    await requirePermission(scope)();
    const url = new URL(req.url);
    const headerTenant = ((_a = req.headers.get("x-tenant-id")) === null || _a === void 0 ? void 0 : _a.trim()) || null;
    const queryTenant = ((_b = url.searchParams.get("tenantId")) === null || _b === void 0 ? void 0 : _b.trim()) || null;
    const tenantId = headerTenant || queryTenant || session.tenantId || DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    const ctx = buildContextFromSession({
        role: session.role,
        userId: session.userId,
        tenantId,
    });
    return { session, tenantId, ctx };
}
export function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export function unauthorized(message = "UNAUTHENTICATED") {
    return NextResponse.json({ error: message }, { status: 401 });
}
export function toAuthErrorResponse(err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "UNAUTHENTICATED")
        return unauthorized(message);
    if (message === "NOT_FOUND") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (message === "FORBIDDEN" ||
        message === "INSUFFICIENT_PERMISSIONS" ||
        message === "TENANT_FORBIDDEN" ||
        message.startsWith("ROLE_") ||
        message.startsWith("FORBIDDEN:")) {
        return forbidden(message);
    }
    if (message.startsWith("BAD_REQUEST")) {
        return NextResponse.json({ error: message }, { status: 400 });
    }
    if (message === "CHECKSUM_MISMATCH") {
        return NextResponse.json({
            error: "Upload integrity check failed (checksum mismatch). Retry or check your connection.",
        }, { status: 400 });
    }
    return null;
}
export function clientIp(req) {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded)
        return forwarded.split(",")[0].trim();
    return req.headers.get("x-real-ip");
}

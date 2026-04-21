import { NextResponse } from "next/server";
import { resolveTenantIdFromHost } from "@/lib/branding/domainMapping";
/**
 * Custom-domain -> tenant: sets `x-tenant-id` when `branding_domains` has an
 * active/verified row for the Host (see `sql/branding_indexes.sql`).
 */
export async function proxy(req) {
    var _a;
    const host = (_a = req.headers.get("host")) !== null && _a !== void 0 ? _a : "";
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-branding-host", host.toLowerCase());
    const mapped = await resolveTenantIdFromHost(host);
    if (mapped) {
        requestHeaders.set("x-tenant-id", mapped);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
}
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

import { NextResponse } from "next/server";
import { readJson, ok } from "@/lib/http";
import { getTenantProfile, updateTenantProfile, } from "@/lib/admin/settings";
import { resolveContext, requirePermission, requireRole, } from "../_context";
import { handleError } from "../_handle";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    try {
        const { session, tenantId } = await resolveContext(req);
        requireRole(session, "director");
        requirePermission(session, "admin.read");
        const tenant = await getTenantProfile(tenantId);
        return ok({ data: tenant });
    }
    catch (err) {
        return handleError(err);
    }
}
export async function PATCH(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const { session, tenantId } = await resolveContext(req);
        requireRole(session, "admin");
        requirePermission(session, "admin.settings.write");
        const body = (_a = (await readJson(req))) !== null && _a !== void 0 ? _a : {};
        const updated = await updateTenantProfile(tenantId, {
            name: typeof body.name === "string" ? body.name : undefined,
            slug: (_b = body.slug) !== null && _b !== void 0 ? _b : undefined,
            logo_url: (_c = body.logo_url) !== null && _c !== void 0 ? _c : undefined,
            primary_color: (_d = body.primary_color) !== null && _d !== void 0 ? _d : undefined,
            accent_color: (_e = body.accent_color) !== null && _e !== void 0 ? _e : undefined,
            timezone: (_f = body.timezone) !== null && _f !== void 0 ? _f : undefined,
            locale: (_g = body.locale) !== null && _g !== void 0 ? _g : undefined,
            plan: (_h = body.plan) !== null && _h !== void 0 ? _h : undefined,
            status: (_j = body.status) !== null && _j !== void 0 ? _j : undefined,
        });
        return NextResponse.json({ data: updated });
    }
    catch (err) {
        return handleError(err);
    }
}

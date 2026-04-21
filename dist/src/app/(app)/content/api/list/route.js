import { NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getContentDashboard } from "@/lib/content";
import { resolveContentContext } from "../../guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req) {
    var _a;
    try {
        const url = new URL(req.url);
        const tenantParam = ((_a = url.searchParams.get("tenantId")) === null || _a === void 0 ? void 0 : _a.trim()) || null;
        let ctx;
        try {
            ctx = await resolveContentContext({ tenantId: tenantParam });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        const data = await getContentDashboard(ctx.tenantId);
        const filtered = ctx.session.role === "student" || ctx.session.role === "family"
            ? Object.assign(Object.assign({}, data), { items: data.items.filter((i) => i.visibility === "public" || i.visibility === "tenant") }) : data;
        await logAudit("content.list", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            total: filtered.items.length,
            source: "api",
        });
        return ok({
            data: {
                tenantId: filtered.tenantId,
                generatedAt: filtered.generatedAt,
                kpis: filtered.kpis,
                items: filtered.items,
                tags: filtered.tags,
                collections: filtered.collections,
            },
        });
    }
    catch (err) {
        return serverError(err);
    }
}

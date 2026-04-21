import { NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { searchContent } from "@/lib/content";
import { resolveContentContext } from "../../guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
async function runSearch(query, tenantParam, role, profileId) {
    let ctx;
    try {
        ctx = await resolveContentContext({ tenantId: tenantParam });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "FORBIDDEN";
        return { error: forbidden(message) };
    }
    const response = await searchContent(ctx.tenantId, query);
    const filtered = role === "student" || role === "family"
        ? Object.assign(Object.assign({}, response), { results: response.results.filter((r) => r.item.visibility === "public" ||
                r.item.visibility === "tenant") }) : response;
    await logAudit("content.search", {
        tenantId: ctx.tenantId,
        profileId,
        role,
        query,
        results: filtered.results.length,
        source: "api",
    });
    return { data: filtered };
}
export async function GET(req) {
    var _a, _b, _c;
    try {
        const url = new URL(req.url);
        const q = ((_a = url.searchParams.get("q")) !== null && _a !== void 0 ? _a : "").trim();
        const tenantParam = ((_b = url.searchParams.get("tenantId")) === null || _b === void 0 ? void 0 : _b.trim()) || null;
        let ctx;
        try {
            ctx = await resolveContentContext({ tenantId: tenantParam });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        if (!q) {
            return ok({
                data: {
                    tenantId: ctx.tenantId,
                    query: "",
                    results: [],
                    generatedAt: new Date().toISOString(),
                },
            });
        }
        const result = await runSearch(q, tenantParam, ctx.session.role, (_c = ctx.session.userId) !== null && _c !== void 0 ? _c : null);
        if ("error" in result)
            return result.error;
        return ok({ data: result.data });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function POST(req) {
    var _a, _b, _c;
    try {
        const body = (await req.json().catch(() => ({})));
        const query = ((_a = body.query) !== null && _a !== void 0 ? _a : "").trim();
        const tenantParam = ((_b = body.tenantId) === null || _b === void 0 ? void 0 : _b.trim()) || null;
        if (!query) {
            return NextResponse.json({ error: "query is required" }, { status: 400 });
        }
        let ctx;
        try {
            ctx = await resolveContentContext({ tenantId: tenantParam });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        const result = await runSearch(query, tenantParam, ctx.session.role, (_c = ctx.session.userId) !== null && _c !== void 0 ? _c : null);
        if ("error" in result)
            return result.error;
        return ok({ data: result.data });
    }
    catch (err) {
        return serverError(err);
    }
}

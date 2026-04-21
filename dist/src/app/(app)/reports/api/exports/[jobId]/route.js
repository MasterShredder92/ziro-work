/**
 * Get export job (status + download).
 * GET /reports/api/exports/[jobId]        -> JSON job summary
 * GET /reports/api/exports/[jobId]?download=1 -> binary download
 */
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { NextResponse } from "next/server";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { notFound, ok, resolveTenantId, serverError } from "@/lib/http";
import { getExportJob } from "@/lib/reports/exportService";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req, ctx) {
    var _a;
    try {
        let session;
        try {
            session = await requirePermission("reports.read")();
        }
        catch (_b) {
            return forbidden();
        }
        const tenantId = (_a = session === null || session === void 0 ? void 0 : session.tenantId) !== null && _a !== void 0 ? _a : resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (err) {
            return forbidden(err instanceof Error ? err.message : "TENANT_MISMATCH");
        }
        const { jobId } = await ctx.params;
        const job = await getExportJob(jobId, tenantId);
        if (!job)
            return notFound("Export job not found");
        const url = new URL(req.url);
        const wantsDownload = url.searchParams.get("download") === "1";
        if (wantsDownload) {
            if (job.status !== "completed" || !job.contentBase64) {
                return NextResponse.json({ error: "Export not ready", status: job.status }, { status: 409 });
            }
            const bytes = Buffer.from(job.contentBase64, "base64");
            return new NextResponse(bytes, {
                status: 200,
                headers: {
                    "Content-Type": job.contentType,
                    "Content-Length": String(bytes.byteLength),
                    "Content-Disposition": `attachment; filename="${job.filename}"`,
                    "Cache-Control": "no-store",
                },
            });
        }
        const { contentBase64: _omit } = job, summary = __rest(job, ["contentBase64"]);
        void _omit;
        return ok({ data: summary });
    }
    catch (err) {
        return serverError(err);
    }
}

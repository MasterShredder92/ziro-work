import { NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getAssessmentDashboard } from "@/lib/assessments";
import { resolveAssessmentsContext } from "../../guard";
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
            ctx = await resolveAssessmentsContext({ tenantId: tenantParam });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        const data = await getAssessmentDashboard(ctx.tenantId);
        await logAudit("assessments.list", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            total: data.kpis.totalAssessments,
            source: "api",
        });
        return ok({
            data: {
                tenantId: data.tenantId,
                generatedAt: data.generatedAt,
                kpis: data.kpis,
                assessments: data.assessments,
            },
        });
    }
    catch (err) {
        return serverError(err);
    }
}

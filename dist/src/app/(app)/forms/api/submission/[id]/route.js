import { NextResponse } from "next/server";
import { notFound, ok, resolveTenantId, serverError, } from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getSubmission } from "@/lib/forms/queries";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req, { params }) {
    const { id } = await params;
    try {
        let session;
        try {
            session = await requirePermission("forms.read")();
        }
        catch (_a) {
            return forbidden();
        }
        const tenantId = session.tenantId || resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_b) {
            return forbidden("TENANT_MISMATCH");
        }
        const submission = await getSubmission(id, tenantId);
        if (!submission)
            return notFound("Submission not found");
        await logAudit("forms.api.submission.get", {
            tenantId,
            profileId: session.userId,
            submissionId: id,
            formId: submission.formId,
        });
        return ok({ data: submission });
    }
    catch (err) {
        return serverError(err);
    }
}

import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { restoreVersion } from "@/lib/content";
import { fireContentItemEvent } from "@/lib/content/triggers";
import { resolveContentApiContext, toAuthErrorResponse, } from "../../../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req, { params, }) {
    var _a;
    try {
        const { id, versionId } = await params;
        const ctx = await resolveContentApiContext(req, { requireWrite: true });
        const { item, version } = await restoreVersion(id, versionId, ctx.tenantId, {
            createdBy: ctx.session.userId,
        });
        await fireContentItemEvent("content.version.restored", item, {
            versionId: version.id,
            versionNumber: version.version,
        }).catch(() => null);
        await logAudit("content.api.versions.restore", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            itemId: id,
            versionId,
            newVersionNumber: version.version,
        });
        return ok({ data: { item, version } });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}

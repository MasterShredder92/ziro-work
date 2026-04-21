import { created, ok, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { createVersion, getContentItem, listVersions, } from "@/lib/content";
import { fireContentItemEvent } from "@/lib/content/triggers";
import { resolveContentApiContext, toAuthErrorResponse, } from "../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        const ctx = await resolveContentApiContext(req);
        const versions = await listVersions(id, ctx.tenantId);
        await logAudit("content.api.versions.list", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            itemId: id,
            count: versions.length,
        });
        return ok({ data: versions });
    }
    catch (err) {
        return (_a = toAuthErrorResponse(err)) !== null && _a !== void 0 ? _a : serverError(err);
    }
}
export async function POST(req, { params }) {
    var _a, _b;
    try {
        const { id } = await params;
        const ctx = await resolveContentApiContext(req, { requireWrite: true });
        const body = await readJson(req);
        const version = await createVersion(id, ctx.tenantId, {
            changeSummary: (_a = body === null || body === void 0 ? void 0 : body.changeSummary) !== null && _a !== void 0 ? _a : null,
            createdBy: ctx.session.userId,
        });
        const item = await getContentItem(id, ctx.tenantId);
        if (item) {
            await fireContentItemEvent("content.version.created", item, {
                versionId: version.id,
                versionNumber: version.version,
            }).catch(() => null);
        }
        await logAudit("content.api.versions.create", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            itemId: id,
            versionId: version.id,
            versionNumber: version.version,
        });
        return created({ data: version });
    }
    catch (err) {
        return (_b = toAuthErrorResponse(err)) !== null && _b !== void 0 ? _b : serverError(err);
    }
}

import { NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { uploadContentFile } from "@/lib/content";
import { resolveContentContext } from "../../guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
    try {
        let ctx;
        try {
            ctx = await resolveContentContext({ requireWrite: true });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        const body = (await req.json().catch(() => ({})));
        const tenantId = (body.tenantId && body.tenantId.trim()) || ctx.tenantId;
        // Re-resolve context for the target tenant to re-run assertTenantAccess.
        if (tenantId !== ctx.tenantId) {
            try {
                ctx = await resolveContentContext({ tenantId, requireWrite: true });
            }
            catch (err) {
                const message = err instanceof Error ? err.message : "FORBIDDEN";
                return forbidden(message);
            }
        }
        if (!((_a = body.file) === null || _a === void 0 ? void 0 : _a.fileName) && !((_b = body.metadata) === null || _b === void 0 ? void 0 : _b.title)) {
            return NextResponse.json({ error: "fileName or title is required" }, { status: 400 });
        }
        if (!((_c = body.metadata) === null || _c === void 0 ? void 0 : _c.title)) {
            return NextResponse.json({ error: "metadata.title is required" }, { status: 400 });
        }
        const file = {
            fileName: (_f = (_e = (_d = body.file) === null || _d === void 0 ? void 0 : _d.fileName) !== null && _e !== void 0 ? _e : body.metadata.title) !== null && _f !== void 0 ? _f : "untitled",
            mimeType: (_h = (_g = body.file) === null || _g === void 0 ? void 0 : _g.mimeType) !== null && _h !== void 0 ? _h : null,
            fileUrl: (_k = (_j = body.file) === null || _j === void 0 ? void 0 : _j.fileUrl) !== null && _k !== void 0 ? _k : null,
            sizeBytes: (_m = (_l = body.file) === null || _l === void 0 ? void 0 : _l.sizeBytes) !== null && _m !== void 0 ? _m : null,
            thumbnailUrl: (_p = (_o = body.file) === null || _o === void 0 ? void 0 : _o.thumbnailUrl) !== null && _p !== void 0 ? _p : null,
            sourceUrl: (_r = (_q = body.file) === null || _q === void 0 ? void 0 : _q.sourceUrl) !== null && _r !== void 0 ? _r : null,
        };
        const metadata = {
            tenantId: ctx.tenantId,
            title: body.metadata.title,
            description: (_s = body.metadata.description) !== null && _s !== void 0 ? _s : null,
            kind: body.metadata.kind,
            visibility: body.metadata.visibility,
            tags: Array.isArray(body.metadata.tags) ? body.metadata.tags : [],
            collectionIds: Array.isArray(body.metadata.collectionIds)
                ? body.metadata.collectionIds
                : [],
            programId: (_t = body.metadata.programId) !== null && _t !== void 0 ? _t : null,
            levelId: (_u = body.metadata.levelId) !== null && _u !== void 0 ? _u : null,
            lessonId: (_v = body.metadata.lessonId) !== null && _v !== void 0 ? _v : null,
            authorId: (_x = (_w = body.metadata.authorId) !== null && _w !== void 0 ? _w : ctx.session.userId) !== null && _x !== void 0 ? _x : null,
            extra: (_y = body.metadata.extra) !== null && _y !== void 0 ? _y : {},
        };
        const result = await uploadContentFile(file, metadata);
        await logAudit("content.upload", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            itemId: result.item.id,
            kind: result.item.kind,
            source: "api",
        });
        return ok({ data: result });
    }
    catch (err) {
        return serverError(err);
    }
}

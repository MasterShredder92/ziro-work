import { NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getContentSurface, recordContentAccess, updateContentMetadata, } from "@/lib/content";
import { resolveContentContext } from "../../guard";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req, { params }) {
    var _a;
    try {
        const { id } = await params;
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
        const surface = await getContentSurface(id, ctx.tenantId);
        if (!surface) {
            return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
        }
        // Enforce visibility for student/family roles.
        const visibility = surface.item.visibility;
        if ((ctx.session.role === "student" || ctx.session.role === "family") &&
            visibility !== "public" &&
            visibility !== "tenant") {
            return forbidden();
        }
        await recordContentAccess(id, ctx.tenantId).catch(() => null);
        await logAudit("content.surface.view", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            itemId: id,
            source: "api",
        });
        return ok({ data: surface });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function PATCH(req, { params }) {
    var _a;
    try {
        const { id } = await params;
        let ctx;
        try {
            ctx = await resolveContentContext({ requireWrite: true });
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "FORBIDDEN";
            return forbidden(message);
        }
        const body = (await req.json().catch(() => ({})));
        const metadata = {
            tenantId: ctx.tenantId,
            title: body.title,
            description: body.description === undefined
                ? undefined
                : body.description,
            kind: body.kind,
            visibility: body.visibility,
            tags: Array.isArray(body.tags) ? body.tags : undefined,
            collectionIds: Array.isArray(body.collectionIds)
                ? body.collectionIds
                : undefined,
            programId: body.programId === undefined ? undefined : body.programId,
            levelId: body.levelId === undefined ? undefined : body.levelId,
            lessonId: body.lessonId === undefined ? undefined : body.lessonId,
            authorId: body.authorId === undefined ? undefined : body.authorId,
            extra: ((_a = body.metadata) !== null && _a !== void 0 ? _a : body.extra),
        };
        const surface = await updateContentMetadata(id, metadata);
        await logAudit("content.update", {
            tenantId: ctx.tenantId,
            profileId: ctx.session.userId,
            role: ctx.session.role,
            itemId: id,
            source: "api",
        });
        return ok({ data: surface });
    }
    catch (err) {
        return serverError(err);
    }
}

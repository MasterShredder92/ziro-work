import { NextRequest, NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import {
  getContentSurface,
  recordContentAccess,
  updateContentMetadata,
} from "@/lib/content";
import { resolveContentContext } from "../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const tenantParam = url.searchParams.get("tenantId")?.trim() || null;

    let ctx;
    try {
      ctx = await resolveContentContext({ tenantId: tenantParam });
    } catch (err) {
      const message = err instanceof Error ? err.message : "FORBIDDEN";
      return forbidden(message);
    }

    const surface = await getContentSurface(id, ctx.tenantId);
    if (!surface) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    // Enforce visibility for student/family roles.
    const visibility = surface.item.visibility;
    if (
      (ctx.session.role === "student" || ctx.session.role === "family") &&
      visibility !== "public" &&
      visibility !== "tenant"
    ) {
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
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    let ctx;
    try {
      ctx = await resolveContentContext({ requireWrite: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "FORBIDDEN";
      return forbidden(message);
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const metadata = {
      tenantId: ctx.tenantId,
      title: body.title as string | undefined,
      description:
        body.description === undefined
          ? undefined
          : (body.description as string | null),
      kind: body.kind as "file" | "document" | "video" | "audio" | "image" | "link" | "note" | undefined,
      visibility: body.visibility as
        | "tenant"
        | "teachers"
        | "public"
        | undefined,
      tags: Array.isArray(body.tags) ? (body.tags as string[]) : undefined,
      collectionIds: Array.isArray(body.collectionIds)
        ? (body.collectionIds as string[])
        : undefined,
      programId:
        body.programId === undefined ? undefined : (body.programId as string | null),
      levelId:
        body.levelId === undefined ? undefined : (body.levelId as string | null),
      lessonId:
        body.lessonId === undefined ? undefined : (body.lessonId as string | null),
      authorId:
        body.authorId === undefined ? undefined : (body.authorId as string | null),
      extra: (body.metadata ?? body.extra) as
        | Record<string, unknown>
        | undefined,
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
  } catch (err) {
    return serverError(err);
  }
}

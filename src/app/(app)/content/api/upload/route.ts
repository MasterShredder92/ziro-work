import { NextRequest, NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { uploadContentFile } from "@/lib/content";
import type {
  UploadFilePayload,
  UploadMetadata,
} from "@/lib/content/types";
import { resolveContentContext } from "../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    let ctx;
    try {
      ctx = await resolveContentContext({ requireWrite: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "FORBIDDEN";
      return forbidden(message);
    }

    const body = (await req.json().catch(() => ({}))) as {
      tenantId?: string;
      file?: Partial<UploadFilePayload>;
      metadata?: Partial<UploadMetadata> & { title?: string };
    };

    const tenantId =
      (body.tenantId && body.tenantId.trim()) || ctx.tenantId;

    // Re-resolve context for the target tenant to re-run assertTenantAccess.
    if (tenantId !== ctx.tenantId) {
      try {
        ctx = await resolveContentContext({ tenantId, requireWrite: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : "FORBIDDEN";
        return forbidden(message);
      }
    }

    if (!body.file?.fileName && !body.metadata?.title) {
      return NextResponse.json(
        { error: "fileName or title is required" },
        { status: 400 },
      );
    }

    if (!body.metadata?.title) {
      return NextResponse.json(
        { error: "metadata.title is required" },
        { status: 400 },
      );
    }

    const file: UploadFilePayload = {
      fileName:
        body.file?.fileName ?? body.metadata.title ?? "untitled",
      mimeType: body.file?.mimeType ?? null,
      fileUrl: body.file?.fileUrl ?? null,
      sizeBytes: body.file?.sizeBytes ?? null,
      thumbnailUrl: body.file?.thumbnailUrl ?? null,
      sourceUrl: body.file?.sourceUrl ?? null,
    };

    const metadata = {
      tenantId: ctx.tenantId,
      title: body.metadata.title,
      description: body.metadata.description ?? null,
      kind: body.metadata.kind,
      visibility: body.metadata.visibility,
      tags: Array.isArray(body.metadata.tags) ? body.metadata.tags : [],
      collectionIds: Array.isArray(body.metadata.collectionIds)
        ? body.metadata.collectionIds
        : [],
      programId: body.metadata.programId ?? null,
      levelId: body.metadata.levelId ?? null,
      lessonId: body.metadata.lessonId ?? null,
      authorId: body.metadata.authorId ?? ctx.session.userId ?? null,
      extra: body.metadata.extra ?? {},
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
  } catch (err) {
    return serverError(err);
  }
}

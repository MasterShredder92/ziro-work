import { NextRequest } from "next/server";
import {
  badRequest,
  noContent,
  notFound,
  ok,
  readJson,
  serverError,
} from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import {
  deleteContentTag,
  getContentTag,
  upsertContentTag,
} from "@data/contentTags";
import type { ContentTag } from "@/lib/content/types";
import {
  resolveContentApiContext,
  toAuthErrorResponse,
} from "../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await resolveContentApiContext(req);
    const tag = await getContentTag(id, ctx.tenantId);
    if (!tag) return notFound("tag not found");
    return ok({ data: tag });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await resolveContentApiContext(req, { requireWrite: true });
    const body = await readJson<Partial<ContentTag>>(req);
    if (!body) return badRequest("request body required");

    const existing = await getContentTag(id, ctx.tenantId);
    if (!existing) return notFound("tag not found");

    const tag = await upsertContentTag(ctx.tenantId, {
      ...existing,
      ...body,
      id,
      label: body.label ?? existing.label,
    });

    await logAudit("content.api.tags.update", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      tagId: id,
    });

    return ok({ data: tag });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await resolveContentApiContext(req, { requireWrite: true });
    await deleteContentTag(id, ctx.tenantId);

    await logAudit("content.api.tags.delete", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      tagId: id,
    });

    return noContent();
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

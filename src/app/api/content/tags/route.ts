import { NextRequest } from "next/server";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { createTag, listTags } from "@/lib/content";
import type { ContentTag } from "@/lib/content/types";
import {
  resolveContentApiContext,
  toAuthErrorResponse,
} from "../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveContentApiContext(req);
    const tags = await listTags(ctx.tenantId);

    await logAudit("content.api.tags.list", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      count: tags.length,
    });

    return ok({ data: tags });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await resolveContentApiContext(req, { requireWrite: true });
    const body = await readJson<Partial<ContentTag>>(req);
    if (!body || typeof body.label !== "string" || !body.label.trim()) {
      return badRequest("label required");
    }

    const tag = await createTag(ctx.tenantId, {
      label: body.label,
      slug: body.slug ?? undefined,
      color: body.color ?? null,
    });

    await logAudit("content.api.tags.create", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      tagId: tag.id,
      label: tag.label,
    });

    return created({ data: tag });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

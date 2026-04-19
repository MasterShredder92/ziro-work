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
  deleteContentItem,
  getContentItem,
  updateContentItem,
  type ContentItem,
} from "@/lib/content";
import { fireContentItemEvent } from "@/lib/content/triggers";
import {
  resolveContentApiContext,
  toAuthErrorResponse,
} from "../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await resolveContentApiContext(req);
    const item = await getContentItem(id, ctx.tenantId);
    if (!item) return notFound("content item not found");

    if (
      (ctx.session.role === "student" || ctx.session.role === "family") &&
      item.visibility !== "public" &&
      item.visibility !== "tenant"
    ) {
      return notFound("content item not found");
    }

    await logAudit("content.api.get", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      itemId: id,
    });

    return ok({ data: item });
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
    const body = await readJson<Partial<ContentItem>>(req);
    if (!body) return badRequest("request body required");

    const before = await getContentItem(id, ctx.tenantId);
    if (!before) return notFound("content item not found");

    const after = await updateContentItem(id, {
      ...before,
      ...body,
      id,
      tenant_id: ctx.tenantId,
      updated_by: body.updated_by ?? ctx.session.userId,
    });

    await fireContentItemEvent("content.updated", after).catch(() => null);

    if (!before.is_published && after.is_published) {
      await fireContentItemEvent("content.published", after).catch(() => null);
    }
    if (!before.is_archived && after.is_archived) {
      await fireContentItemEvent("content.archived", after).catch(() => null);
    }
    if (before.folder_id !== after.folder_id) {
      await fireContentItemEvent("content.moved", after, {
        previousFolderId: before.folder_id,
      }).catch(() => null);
    }

    await logAudit("content.api.update", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      itemId: id,
    });

    return ok({ data: after });
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

    const existing = await getContentItem(id, ctx.tenantId);
    if (!existing) return noContent();

    await deleteContentItem(id, ctx.tenantId);

    await fireContentItemEvent("content.deleted", existing).catch(() => null);

    await logAudit("content.api.delete", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      itemId: id,
    });

    return noContent();
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

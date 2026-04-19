import { NextRequest } from "next/server";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import {
  createContentItem,
  listContentItems,
  type ContentItem,
} from "@/lib/content";
import {
  fireContentItemEvent,
} from "@/lib/content/triggers";
import {
  resolveContentApiContext,
  toAuthErrorResponse,
} from "./_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveContentApiContext(req);
    const url = new URL(req.url);
    const folderId = url.searchParams.get("folderId");
    const tagId = url.searchParams.get("tagId");
    const kind = url.searchParams.get("kind");
    const contentType = url.searchParams.get("contentType");
    const visibility = url.searchParams.get("visibility");
    const search = url.searchParams.get("search");
    const includeArchived = url.searchParams.get("includeArchived") === "true";
    const publishedOnly = url.searchParams.get("publishedOnly") === "true";

    const items = await listContentItems(ctx.tenantId, {
      folderId: folderId === "root" ? null : folderId ?? undefined,
      tagId: tagId ?? undefined,
      kind: kind ?? undefined,
      contentType: contentType ?? undefined,
      visibility: visibility ?? undefined,
      search: search ?? undefined,
      includeArchived,
      publishedOnly,
    });

    const visible =
      ctx.session.role === "student" || ctx.session.role === "family"
        ? items.filter(
            (i) => i.visibility === "public" || i.visibility === "tenant",
          )
        : items;

    await logAudit("content.api.list", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      total: visible.length,
    });

    return ok({ data: visible });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await resolveContentApiContext(req, { requireWrite: true });
    const body = await readJson<Partial<ContentItem>>(req);
    if (!body || typeof body.title !== "string" || !body.title.trim()) {
      return badRequest("title required");
    }

    const item = await createContentItem({
      ...body,
      tenant_id: ctx.tenantId,
      title: body.title,
      created_by: body.created_by ?? ctx.session.userId,
      updated_by: body.updated_by ?? ctx.session.userId,
    });

    await fireContentItemEvent("content.created", item).catch(() => null);
    if (item.is_published) {
      await fireContentItemEvent("content.published", item).catch(() => null);
    }

    await logAudit("content.api.create", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      itemId: item.id,
      title: item.title,
    });

    return created({ data: item });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

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
  deleteFolder,
  getFolder,
  updateFolder,
  type ContentFolder,
} from "@/lib/content";
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
    const folder = await getFolder(id, ctx.tenantId);
    if (!folder) return notFound("folder not found");
    return ok({ data: folder });
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
    const body = await readJson<Partial<ContentFolder>>(req);
    if (!body) return badRequest("request body required");

    const folder = await updateFolder(id, ctx.tenantId, body);

    await logAudit("content.api.folders.update", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      folderId: id,
    });

    return ok({ data: folder });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "NOT_FOUND") return notFound("folder not found");
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
    await deleteFolder(id, ctx.tenantId);

    await logAudit("content.api.folders.delete", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      folderId: id,
    });

    return noContent();
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

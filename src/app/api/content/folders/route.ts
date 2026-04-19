import { NextRequest } from "next/server";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { createFolder, listFolders, type ContentFolder } from "@/lib/content";
import {
  resolveContentApiContext,
  toAuthErrorResponse,
} from "../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveContentApiContext(req);
    const folders = await listFolders(ctx.tenantId);

    await logAudit("content.api.folders.list", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      count: folders.length,
    });

    return ok({ data: folders });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await resolveContentApiContext(req, { requireWrite: true });
    const body = await readJson<Partial<ContentFolder>>(req);
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return badRequest("name required");
    }

    const folder = await createFolder(ctx.tenantId, {
      ...body,
      name: body.name,
      created_by: body.created_by ?? ctx.session.userId,
    });

    await logAudit("content.api.folders.create", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      folderId: folder.id,
      name: folder.name,
    });

    return created({ data: folder });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

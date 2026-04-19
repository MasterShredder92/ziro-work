import { NextRequest } from "next/server";
import { badRequest, noContent, readJson, serverError } from "@/lib/http";
import { bulkDeleteFiles, bulkMoveFiles } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  action: "delete" | "move";
  fileIds: string[];
  folderId?: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const { tenantId, ctx } = await resolveFilesApiContext(req, {
      requireWrite: true,
    });
    const body = await readJson<Body>(req);
    if (!body?.action || !Array.isArray(body.fileIds) || body.fileIds.length === 0) {
      return badRequest("action and fileIds required");
    }
    if (body.action === "delete") {
      await bulkDeleteFiles(body.fileIds, tenantId, ctx);
      return noContent();
    }
    if (body.action === "move") {
      await bulkMoveFiles(body.fileIds, body.folderId ?? null, tenantId, ctx);
      return noContent();
    }
    return badRequest("unknown action");
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

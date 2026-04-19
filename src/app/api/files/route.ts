import { NextRequest } from "next/server";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { createFile, getFilesDashboard } from "@/lib/files/service";
import type { FileInput, FileUploadPayload } from "@/lib/files/types";
import { resolveFilesApiContext, toAuthErrorResponse } from "./_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await resolveFilesApiContext(req);
    const data = await getFilesDashboard(tenantId);
    return ok({ data });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId, ctx } = await resolveFilesApiContext(req, {
      requireWrite: true,
    });
    const body = await readJson<FileInput & { upload?: FileUploadPayload }>(req);
    if (!body || typeof body.name !== "string" || !body.name.trim()) {
      return badRequest("name required");
    }
    const { upload, ...input } = body;
    const file = await createFile({ tenantId, input, upload, context: ctx });
    return created({ data: file });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

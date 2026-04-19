import { NextRequest } from "next/server";
import { badRequest, ok, readJson, serverError } from "@/lib/http";
import { uploadNewVersion } from "@/lib/files/service";
import type { FileUploadPayload } from "@/lib/files/types";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return badRequest("id required");
    const { tenantId, ctx } = await resolveFilesApiContext(req, {
      requireWrite: true,
    });
    const body = await readJson<FileUploadPayload>(req);
    if (
      !body ||
      typeof body.fileName !== "string" ||
      typeof body.base64 !== "string"
    ) {
      return badRequest("fileName and base64 required");
    }
    const file = await uploadNewVersion(id, tenantId, body, ctx);
    return ok({ data: file });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

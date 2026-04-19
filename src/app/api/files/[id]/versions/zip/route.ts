import { NextRequest } from "next/server";
import { badRequest, serverError } from "@/lib/http";
import { buildAllVersionsZip } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) return badRequest("id required");
    const { tenantId, ctx } = await resolveFilesApiContext(req);
    const bytes = await buildAllVersionsZip(id, tenantId, ctx);
    const name =
      req.headers.get("x-download-name")?.replace(/[^\w.\-]+/g, "_") ||
      `file-${id}-versions.zip`;
    return new Response(Buffer.from(bytes), {
      headers: {
        "content-type": "application/zip",
        "content-disposition": `attachment; filename="${name}"`,
      },
    });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

import { NextRequest } from "next/server";
import { badRequest, ok, readJson, serverError } from "@/lib/http";
import { regenerateShareLinkToken } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { tenantId, ctx } = await resolveFilesApiContext(req, {
      requireShare: true,
    });
    const body = await readJson<{ linkId?: string }>(req);
    const linkId = body?.linkId?.trim();
    if (!linkId) return badRequest("linkId required");
    const link = await regenerateShareLinkToken(linkId, tenantId, ctx);
    return ok({ data: link });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

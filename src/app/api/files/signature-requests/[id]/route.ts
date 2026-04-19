import { NextRequest } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http";
import { getSignatureRequestDetail } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../_context";

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
    const data = await getSignatureRequestDetail(id, tenantId, ctx);
    return ok({ data });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

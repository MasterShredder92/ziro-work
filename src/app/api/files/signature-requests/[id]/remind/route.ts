import { NextRequest } from "next/server";
import { badRequest, ok, readJson, serverError } from "@/lib/http";
import { sendSignatureReminder } from "@/lib/files/service";
import { resolveFilesApiContext, toAuthErrorResponse } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { signerId: string };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: requestId } = await params;
    if (!requestId) return badRequest("id required");
    const { tenantId, ctx } = await resolveFilesApiContext(req, {
      requireSign: true,
    });
    const body = await readJson<Body>(req);
    if (!body?.signerId) return badRequest("signerId required");
    const updated = await sendSignatureReminder(
      requestId,
      body.signerId,
      tenantId,
      ctx,
    );
    return ok({ data: updated });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

import { NextRequest } from "next/server";
import { badRequest, created, readJson, serverError } from "@/lib/http";
import { createSignatureRequest } from "@/lib/files/service";
import type { SignatureRequestInput } from "@/lib/files/types";
import { resolveFilesApiContext, toAuthErrorResponse } from "../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { tenantId, ctx } = await resolveFilesApiContext(req, {
      requireSign: true,
    });
    const body = await readJson<SignatureRequestInput>(req);
    if (
      !body ||
      typeof body.fileId !== "string" ||
      typeof body.title !== "string"
    ) {
      return badRequest("fileId and title required");
    }
    if (!Array.isArray(body.signers) || body.signers.length === 0) {
      return badRequest("at least one signer required");
    }
    const request = await createSignatureRequest(tenantId, body, ctx);
    return created({ data: request });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

import { NextRequest } from "next/server";
import { badRequest, ok, readJson, serverError } from "@/lib/http";
import {
  getSignatureSurfaceByToken,
  recordFieldFill,
  recordSignerDecline,
  recordSignerSignature,
  recordSignerView,
} from "@/lib/files/service";
import { clientIp } from "../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public signer endpoint. The `id` path param is the signer token.
 * No authentication required — access governed by the signer's unique token.
 *
 * GET  — returns the signature surface, marks signer as "viewed".
 * PATCH — { action: "fill" | "sign" | "decline", fieldId?, value?, reason? }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: token } = await params;
    if (!token) return badRequest("token required");
    const ctx = {
      ip: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    };
    await recordSignerView(token, ctx);
    const surface = await getSignatureSurfaceByToken(token);
    return ok({ data: surface });
  } catch (err) {
    return toResponse(err);
  }
}

type PatchBody =
  | { action: "fill"; fieldId: string; value: string }
  | { action: "sign" }
  | { action: "decline"; reason?: string | null };

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: token } = await params;
    if (!token) return badRequest("token required");
    const body = await readJson<PatchBody>(req);
    if (!body || typeof (body as PatchBody).action !== "string") {
      return badRequest("action required");
    }
    const ctx = {
      ip: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    };
    const action = body.action;
    if (action === "fill") {
      if (!body.fieldId || typeof body.value !== "string") {
        return badRequest("fieldId and value required for fill");
      }
      const request = await recordFieldFill(
        token,
        body.fieldId,
        body.value,
        ctx,
      );
      return ok({ data: request });
    }
    if (action === "sign") {
      const request = await recordSignerSignature(token, ctx);
      return ok({ data: request });
    }
    if (action === "decline") {
      const reason = body.reason ?? null;
      const request = await recordSignerDecline(token, reason, ctx);
      return ok({ data: request });
    }
    return badRequest(`unknown action: ${String(action)}`);
  } catch (err) {
    return toResponse(err);
  }
}

function toResponse(err: unknown): Response {
  const message = err instanceof Error ? err.message : String(err);
  if (message === "NOT_FOUND") {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  if (message.startsWith("FORBIDDEN")) {
    return new Response(JSON.stringify({ error: message }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  return serverError(err);
}

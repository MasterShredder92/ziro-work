import { badRequest, ok, readJson, serverError } from "@/lib/http";
import { getSignatureSurfaceByToken, recordFieldFill, recordSignerDecline, recordSignerSignature, recordSignerView, } from "@/lib/files/service";
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
export async function GET(req, { params }) {
    try {
        const { id: token } = await params;
        if (!token)
            return badRequest("token required");
        const ctx = {
            ip: clientIp(req),
            userAgent: req.headers.get("user-agent"),
        };
        await recordSignerView(token, ctx);
        const surface = await getSignatureSurfaceByToken(token);
        return ok({ data: surface });
    }
    catch (err) {
        return toResponse(err);
    }
}
export async function PATCH(req, { params }) {
    var _a;
    try {
        const { id: token } = await params;
        if (!token)
            return badRequest("token required");
        const body = await readJson(req);
        if (!body || typeof body.action !== "string") {
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
            const request = await recordFieldFill(token, body.fieldId, body.value, ctx);
            return ok({ data: request });
        }
        if (action === "sign") {
            const request = await recordSignerSignature(token, ctx);
            return ok({ data: request });
        }
        if (action === "decline") {
            const reason = (_a = body.reason) !== null && _a !== void 0 ? _a : null;
            const request = await recordSignerDecline(token, reason, ctx);
            return ok({ data: request });
        }
        return badRequest(`unknown action: ${String(action)}`);
    }
    catch (err) {
        return toResponse(err);
    }
}
function toResponse(err) {
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

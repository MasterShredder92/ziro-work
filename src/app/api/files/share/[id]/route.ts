import { NextRequest } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http";
import { viewShareLink } from "@/lib/files/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public share-link viewer. The `id` path param is treated as the share token.
 * No authentication required — access is governed by the token, password,
 * max-views, and expiration fields on the share link.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: token } = await params;
    if (!token) return badRequest("token required");
    const url = new URL(req.url);
    const password = url.searchParams.get("password");
    const result = await viewShareLink(token, { password });
    return ok({ data: result });
  } catch (err) {
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
}

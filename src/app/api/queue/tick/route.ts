import { NextResponse, type NextRequest } from "next/server";
import { tick } from "@/lib/queue/runner";
import { timingSafeEqualStrings } from "@/lib/security/crypto";
import { withApi } from "@/lib/errors/handler";
import { AppError } from "@/lib/errors/AppError";

export const dynamic = "force-dynamic";

/**
 * Internal cron endpoint. Protected by either:
 *   - `Authorization: Bearer <ZIRO_QUEUE_TOKEN>`
 *   - Vercel Cron's `x-vercel-cron` header when deployed on Vercel.
 *
 * Wire this up with a schedule (every 1-5 minutes) via vercel.json or a
 * Supabase scheduled function pointing to this URL.
 */
export const POST = withApi(
  { name: "api.queue.tick.POST" },
  async (req: NextRequest) => {
    if (!isAuthorized(req)) {
      throw AppError.forbidden("Unauthorized cron request");
    }
    const url = new URL(req.url);
    const max = Number(url.searchParams.get("max") ?? "10");
    const kinds = url.searchParams.get("kinds")?.split(",").filter(Boolean) ?? undefined;
    const result = await tick({ maxJobs: Number.isFinite(max) && max > 0 ? max : 10, kinds });
    return NextResponse.json(result);
  },
);

export const GET = POST;

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
  const token = process.env.ZIRO_QUEUE_TOKEN;
  if (!token) return false;
  const auth = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
  if (!match) return false;
  return timingSafeEqualStrings(match[1], token);
}

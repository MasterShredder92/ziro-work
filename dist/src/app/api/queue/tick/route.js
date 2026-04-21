import { NextResponse } from "next/server";
import { tick } from "@/lib/queue/runner";
import { ensureQueueHandlersRegistered } from "@/lib/queue/registerHandlers";
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
export const POST = withApi({ name: "api.queue.tick.POST" }, async (req) => {
    var _a, _b, _c;
    if (!isAuthorized(req)) {
        throw AppError.forbidden("Unauthorized cron request");
    }
    ensureQueueHandlersRegistered();
    const url = new URL(req.url);
    const max = Number((_a = url.searchParams.get("max")) !== null && _a !== void 0 ? _a : "10");
    const kinds = (_c = (_b = url.searchParams.get("kinds")) === null || _b === void 0 ? void 0 : _b.split(",").filter(Boolean)) !== null && _c !== void 0 ? _c : undefined;
    const result = await tick({ maxJobs: Number.isFinite(max) && max > 0 ? max : 10, kinds });
    return NextResponse.json(result);
});
export const GET = POST;
function isAuthorized(req) {
    var _a;
    if (req.headers.get("x-vercel-cron"))
        return true;
    const token = process.env.ZIRO_QUEUE_TOKEN;
    if (!token)
        return false;
    const auth = (_a = req.headers.get("authorization")) !== null && _a !== void 0 ? _a : "";
    const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (!match)
        return false;
    return timingSafeEqualStrings(match[1], token);
}

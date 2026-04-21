import { NextResponse } from "next/server";
import { renderPrometheus } from "@/lib/observability/metrics";
import { timingSafeEqualStrings } from "@/lib/security/crypto";
export const dynamic = "force-dynamic";
/**
 * Text-format metrics endpoint. Gate behind a shared token to avoid
 * exposing internal counters publicly. Token is provided via the
 * `ZIRO_METRICS_TOKEN` env var; scrapers send it as `Authorization: Bearer`.
 *
 * If the env var is unset, the endpoint returns 404 (metrics disabled).
 */
export async function GET(req) {
    var _a;
    const token = process.env.ZIRO_METRICS_TOKEN;
    if (!token) {
        return NextResponse.json({ error: "metrics disabled" }, { status: 404 });
    }
    const auth = (_a = req.headers.get("authorization")) !== null && _a !== void 0 ? _a : "";
    const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (!match || !timingSafeEqualStrings(match[1], token)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const body = renderPrometheus();
    return new NextResponse(body, {
        status: 200,
        headers: {
            "content-type": "text/plain; version=0.0.4; charset=utf-8",
            "cache-control": "no-store",
        },
    });
}

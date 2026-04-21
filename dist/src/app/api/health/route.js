import { NextResponse } from "next/server";
import { runHealthChecks } from "@/lib/observability/health";
export const dynamic = "force-dynamic";
export async function GET() {
    const report = await runHealthChecks();
    const status = report.status === "ok" ? 200 : report.status === "degraded" ? 200 : 503;
    return NextResponse.json(report, {
        status,
        headers: { "cache-control": "no-store" },
    });
}

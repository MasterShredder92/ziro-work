import { NextResponse } from "next/server";
import { z } from "zod";
import { runWorkflow } from "@/lib/automation/workflows/automationOps";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const RunSchema = z.object({
    workflowId: z.string().min(1),
    tenantId: z.string().min(1),
    payload: z.record(z.string(), z.unknown()).optional(),
    triggeredBy: z.string().nullable().optional(),
});
export async function POST(req) {
    var _a, _b;
    try {
        const body = await req.json();
        const parsed = RunSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid run payload", details: parsed.error.flatten() }, { status: 400 });
        }
        const run = await runWorkflow(parsed.data.workflowId, {
            tenantId: parsed.data.tenantId,
            payload: (_a = parsed.data.payload) !== null && _a !== void 0 ? _a : {},
            triggeredBy: (_b = parsed.data.triggeredBy) !== null && _b !== void 0 ? _b : null,
        });
        return NextResponse.json({ data: run }, { status: 202 });
    }
    catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
    }
}

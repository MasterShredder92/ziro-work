import { z } from "zod";
import { enrollStudent, listEnrollmentsFor } from "@/lib/crm";
import { badRequest, created, ok, readJson, serverError } from "@/lib/http";
import { resolveCRMContext } from "../_context";
import { emitEvent } from "@/lib/events/emitEvent";
import { processAgentEvent } from "@/lib/agents/eventProcessor";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c;
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.read"],
        minRole: "teacher",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const url = new URL(req.url);
        const data = await listEnrollmentsFor(resolved.context.tenantId, {
            student_id: (_a = url.searchParams.get("studentId")) !== null && _a !== void 0 ? _a : undefined,
            teacher_id: (_b = url.searchParams.get("teacherId")) !== null && _b !== void 0 ? _b : undefined,
            status: (_c = url.searchParams.get("status")) !== null && _c !== void 0 ? _c : undefined,
        });
        return ok({ data, count: data.length });
    }
    catch (err) {
        return serverError(err);
    }
}
const EnrollSchema = z.object({
    studentId: z.string().uuid(),
    teacherId: z.string().uuid(),
    startDate: z.string().optional(),
    status: z.string().optional(),
});
export async function POST(req) {
    const resolved = await resolveCRMContext(req, {
        permissions: ["crm.write"],
        minRole: "director",
    });
    if ("response" in resolved)
        return resolved.response;
    try {
        const body = await readJson(req);
        const parsed = EnrollSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid enrollment payload", parsed.error.flatten());
        }
        const row = await enrollStudent(resolved.context.tenantId, parsed.data);
        const tenantId = resolved.context.tenantId;
        // Emit student.enrolled so agents can react (Star sends welcome, Bub sets up billing)
        await emitEvent({
            tenantId,
            eventType: "student.enrolled",
            entityType: "student",
            entityId: parsed.data.studentId,
            payload: { enrollment: row, teacherId: parsed.data.teacherId },
        });
        // Emit invoice.created trigger so Bub agent can generate the first invoice
        const invoiceEvent = {
            tenantId,
            eventType: "invoice.created",
            entityType: "student",
            entityId: parsed.data.studentId,
            payload: { trigger: "enrollment", enrollment: row },
        };
        await emitEvent(invoiceEvent);
        // Fire-and-forget: Bub processes enrollment (creates invoice, sends confirmation)
        const enrolledEvent = {
            tenantId,
            eventType: "student.enrolled",
            entityType: "student",
            entityId: parsed.data.studentId,
            payload: { enrollment: row, teacherId: parsed.data.teacherId, studentId: parsed.data.studentId },
        };
        processAgentEvent(enrolledEvent).catch((e) => console.error("[enrollments] Agent event processing failed:", e));
        return created({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}

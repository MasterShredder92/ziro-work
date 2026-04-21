import { z } from "zod";
import { createLead, listLeads, } from "@data/leads";
import { badRequest, created, ok, parseListQuery, readJson, resolveTenantId, serverError, } from "@/lib/http";
import { emitEvent } from "@/lib/events/emitEvent";
import { processAgentEvent } from "@/lib/agents/eventProcessor";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req) {
    var _a, _b, _c, _d, _e;
    try {
        const tenantId = resolveTenantId(req);
        const url = new URL(req.url);
        const filter = {
            stage: (_a = url.searchParams.get("stage")) !== null && _a !== void 0 ? _a : undefined,
            assigned_to: (_b = url.searchParams.get("assigned_to")) !== null && _b !== void 0 ? _b : undefined,
            location_id: (_c = url.searchParams.get("location_id")) !== null && _c !== void 0 ? _c : undefined,
            source: (_d = url.searchParams.get("source")) !== null && _d !== void 0 ? _d : undefined,
            intake_submission_id: (_e = url.searchParams.get("intake_submission_id")) !== null && _e !== void 0 ? _e : undefined,
        };
        const unconverted = url.searchParams.get("unconverted");
        if (unconverted === "true")
            filter.converted_student_id = null;
        const data = await listLeads(tenantId, filter, parseListQuery(req));
        return ok({ data, count: data.length });
    }
    catch (err) {
        return serverError(err);
    }
}
const LeadCreateSchema = z.object({
    first_name: z.string().min(1),
    last_name: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    parent_name: z.string().nullable().optional(),
    student_name: z.string().nullable().optional(),
    age: z.string().nullable().optional(),
    age_range: z.string().nullable().optional(),
    instrument: z.string().nullable().optional(),
    experience: z.string().nullable().optional(),
    goals: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    source_page: z.string().nullable().optional(),
    how_heard: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    location_id: z.string().uuid().nullable().optional(),
    secondary_location_ids: z.array(z.string().uuid()).nullable().optional(),
    preferred_days: z.array(z.string()).nullable().optional(),
    preferred_times: z.string().nullable().optional(),
    preferred_locations: z.array(z.string()).nullable().optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    assigned_teacher_id: z.string().uuid().nullable().optional(),
    family_id: z.string().uuid().nullable().optional(),
    intake_submission_id: z.string().uuid().nullable().optional(),
    referred_by_family_id: z.string().uuid().nullable().optional(),
    referral_code_used: z.string().nullable().optional(),
    is_military: z.boolean().optional(),
    tags: z.array(z.string()).nullable().optional(),
    stage: z.string().optional(),
});
export async function POST(req) {
    try {
        const tenantId = resolveTenantId(req);
        const body = await readJson(req);
        const parsed = LeadCreateSchema.safeParse(body);
        if (!parsed.success) {
            return badRequest("Invalid lead payload", parsed.error.flatten());
        }
        const row = await createLead(tenantId, parsed.data);
        // Emit lead.created and dispatch to Star agent
        const leadEvent = {
            tenantId,
            eventType: "lead.created",
            entityType: "lead",
            entityId: row.id,
            payload: { lead: row },
        };
        await emitEvent(leadEvent);
        // Fire-and-forget: Star processes the event (sends welcome email, updates stage)
        processAgentEvent(leadEvent).catch((e) => console.error("[leads] Agent event processing failed:", e));
        return created({ data: row });
    }
    catch (err) {
        return serverError(err);
    }
}

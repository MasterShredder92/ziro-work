import { NextRequest } from "next/server";
import { z } from "zod";
import {
  createLead,
  listLeads,
  type LeadFilter,
} from "@data/leads";
import type { LeadInsert } from "@/lib/types/entities";
import {
  badRequest,
  created,
  ok,
  parseListQuery,
  readJson,
  resolveTenantId,
  serverError,
} from "@/lib/http";
import { emitEvent } from "@/lib/events/emitEvent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req);
    const url = new URL(req.url);
    const filter: LeadFilter = {
      stage: url.searchParams.get("stage") ?? undefined,
      assigned_to: url.searchParams.get("assigned_to") ?? undefined,
      location_id: url.searchParams.get("location_id") ?? undefined,
      source: url.searchParams.get("source") ?? undefined,
      intake_submission_id:
        url.searchParams.get("intake_submission_id") ?? undefined,
    };
    const unconverted = url.searchParams.get("unconverted");
    if (unconverted === "true") filter.converted_student_id = null;
    const data = await listLeads(tenantId, filter, parseListQuery(req));
    return ok({ data, count: data.length });
  } catch (err) {
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

export async function POST(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req);
    const body = await readJson(req);
    const parsed = LeadCreateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid lead payload", parsed.error.flatten());
    }
    const row = await createLead(
      tenantId,
      parsed.data as unknown as Omit<LeadInsert, "tenant_id">,
    );
    // Emit lead.created and dispatch to Star agent
    const leadEvent = {
      tenantId,
      eventType: "lead.created",
      entityType: "lead",
      entityId: row.id,
      payload: { lead: row },
    };
    await emitEvent(leadEvent);
    // Agent event processing removed
    return created({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

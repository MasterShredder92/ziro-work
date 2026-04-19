import { NextRequest } from "next/server";
import { z } from "zod";
import {
  deleteLead,
  getLeadById,
  updateLead,
} from "@data/leads";
import type { LeadUpdate } from "@/lib/types/entities";
import {
  badRequest,
  noContent,
  notFound,
  ok,
  readJson,
  resolveTenantId,
  serverError,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const tenantId = resolveTenantId(req);
    const row = await getLeadById(id, tenantId);
    if (!row) return notFound();
    return ok({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

const LeadUpdateSchema = z
  .object({
    first_name: z.string().min(1).optional(),
    last_name: z.string().nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().nullable().optional(),
    stage: z.string().optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    assigned_teacher_id: z.string().uuid().nullable().optional(),
    matched_teacher_id: z.string().uuid().nullable().optional(),
    matched_block_id: z.string().uuid().nullable().optional(),
    family_id: z.string().uuid().nullable().optional(),
    converted_student_id: z.string().uuid().nullable().optional(),
    location_id: z.string().uuid().nullable().optional(),
    notes: z.string().nullable().optional(),
    next_action: z.string().nullable().optional(),
    next_follow_up_at: z.string().nullable().optional(),
    lost_reason: z.string().nullable().optional(),
    lost_category: z.string().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    preferred_days: z.array(z.string()).nullable().optional(),
    preferred_times: z.string().nullable().optional(),
  })
  .passthrough();

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const tenantId = resolveTenantId(req);
    const body = await readJson(req);
    const parsed = LeadUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid update payload", parsed.error.flatten());
    }
    const row = await updateLead(id, tenantId, parsed.data as unknown as LeadUpdate);
    return ok({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const tenantId = resolveTenantId(req);
    await deleteLead(id, tenantId);
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}

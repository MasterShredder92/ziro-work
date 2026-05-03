import { NextRequest } from "next/server";
import { z } from "zod";
import {
  deactivateStudent,
  getStudentById,
  updateStudent,
} from "@data/students";
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
    const data = await getStudentById(id, tenantId);
    if (!data) return notFound();
    return ok({ data });
  } catch (err) {
    return serverError(err);
  }
}

/**
 * Strict whitelist for student PATCH.
 * Adding a new field? Add it here AND verify the DB column type/null-ability.
 */
const StudentUpdateSchema = z
  .object({
    // Enrollment basics
    instrument: z.string().trim().min(1).nullable().optional(),
    lesson_day_of_week: z.number().int().min(0).max(6).nullable().optional(),
    blocks_per_week: z.number().int().min(0).max(10).optional(), // NOT NULL in DB
    sessions_per_month: z.number().int().min(0).max(100).optional(),
    experience_level: z.string().trim().min(1).nullable().optional(),
    status: z.enum(["active", "inactive", "trial", "paused"]).optional(), // NOT NULL in DB; CHECK constraint enforces same set
    // Profile
    first_name: z.string().trim().min(1).optional(),
    last_name: z.string().trim().min(1).optional(),
    bio: z.string().nullable().optional(),
    goals: z.string().nullable().optional(),
    learning_style: z.string().nullable().optional(),
    photo_url: z.string().url().nullable().optional(),
    // Lifecycle
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    // Relations
    location_id: z.string().uuid().nullable().optional(),
  })
  .strict();

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const tenantId = resolveTenantId(req);
    const body = await readJson(req);
    const parsed = StudentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid update payload", parsed.error.flatten());
    }
    if (Object.keys(parsed.data).length === 0) {
      return badRequest("No fields to update");
    }
    try {
      const data = await updateStudent(id, tenantId, parsed.data);
      return ok({ data });
    } catch (dbErr) {
      // Surface the real Postgres error message to the client so the modal can show it
      const msg = dbErr instanceof Error ? dbErr.message : "Database update failed";
      console.error("[students.PATCH]", { id, payload: parsed.data, error: dbErr });
      return badRequest(msg);
    }
  } catch (err) {
    return serverError(err);
  }
}

const DeactivateSchema = z.object({
  deactivated_by: z.string().uuid(),
  reason: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
});

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const tenantId = resolveTenantId(req);
    const body = await readJson(req);
    const parsed = DeactivateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(
        "Deactivation requires deactivated_by",
        parsed.error.flatten(),
      );
    }
    await deactivateStudent(
      id,
      tenantId,
      parsed.data.deactivated_by,
      parsed.data.reason ?? undefined,
      parsed.data.category ?? undefined,
    );
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}

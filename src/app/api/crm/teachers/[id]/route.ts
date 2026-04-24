import { NextRequest } from "next/server";
import { z } from "zod";
import {
  deleteTeacher,
  getTeacherById,
  updateTeacher,
} from "@data/teachers";
import {
  badRequest,
  noContent,
  notFound,
  ok,
  readJson,
  serverError,
} from "@/lib/http";
import { resolveCRMContext } from "../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id } = await ctx.params;
    const { data, error } = await getTeacherById(id);
    if (error) return serverError(error);
    if (!data) return notFound();
    if (
      data.tenant_id &&
      data.tenant_id !== resolved.context.tenantId &&
      resolved.context.session.baseRole !== "admin"
    ) {
      return notFound();
    }
    return ok({ data });
  } catch (err) {
    return serverError(err);
  }
}

/** Whitelist of columns that actually exist in the teachers table.
 *  Any key NOT in this set is stripped before the DB update to prevent
 *  Postgres "column X does not exist" 500 errors. */
const ALLOWED_TEACHER_COLUMNS = new Set([
  "first_name", "last_name", "display_name", "email", "phone",
  "status", "is_active", "teacher_role", "hire_date",
  "rate_per_block", "pay_rate_per_half_hour", "max_students",
  "needs_1099", "is_sub_available", "sub_available",
  "bio", "lesson_style", "teaching_strengths", "musical_strengths_background",
  "director_notes", "instruments", "primary_instruments", "secondary_instruments",
  "photo_url", "personality", "customer_facing_match_summary",
  "best_match_students", "internal_matching_tags", "internal_match_notes",
  "use_caution_internal_placement_notes", "meet_and_greet_fit",
  "substitute_coverage", "style_genre_strengths", "preferred_age_range",
  "acceptable_age_range", "skill_levels_by_instrument", "best_first_lesson_fit",
  "w9_status", "w9_completed_at", "contract_status", "contract_pdf_url",
]);

const UpdateSchema = z.record(z.string(), z.unknown());

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id } = await ctx.params;
    const body = await readJson(req);
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid teacher patch", parsed.error.flatten());
    }
    // Strip unknown columns to prevent Postgres errors
    const safeData = Object.fromEntries(
      Object.entries(parsed.data).filter(([k]) => ALLOWED_TEACHER_COLUMNS.has(k))
    );
    if (Object.keys(safeData).length === 0) {
      return badRequest("No valid fields to update");
    }
    const row = await updateTeacher(id, resolved.context.tenantId, safeData);
    return ok({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "admin",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id } = await ctx.params;
    await deleteTeacher(id, resolved.context.tenantId);
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}

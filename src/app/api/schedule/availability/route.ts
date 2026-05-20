import { NextRequest } from "next/server";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";
import { ok, serverError, badRequest } from "@/lib/http";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/schedule/availability?location_id=...&day_of_week=...
 * Returns all active teacher_availability rows for a location (optionally filtered by day).
 * Used by LocationScheduleGrid to fetch availability client-side (bypasses SSR payload size limits).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("location_id");
  const dayOfWeek = searchParams.get("day_of_week"); // optional

  if (!locationId) return badRequest("location_id required");

  const tenantId = DEFAULT_TENANT_ID;
  const supabase = await createTenantBoundSupabaseClient({ tenantId });

  let query = supabase
    .from("teacher_availability")
    .select("id, teacher_id, location_id, day_of_week, start_time, end_time, is_active, tenant_id")
    .eq("tenant_id", tenantId)
    .eq("location_id", locationId)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(2000);

  if (dayOfWeek) {
    query = query.eq("day_of_week", dayOfWeek);
  }

  const { data, error } = await query;
  if (error) return serverError(error.message);

  return ok({ data: data ?? [] });
}

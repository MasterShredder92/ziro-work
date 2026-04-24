import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { badRequest, ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/crm/teachers/[id]/locations
 * Returns all location assignments for the teacher, with location name/color.
 * Uses a manual two-step query because teacher_locations has no FK to locations.
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id: teacherId } = await ctx.params;
    const db = getServiceClient();

    // Step 1: get teacher_location rows
    const { data: tlRows, error: tlError } = await db
      .from("teacher_locations")
      .select("id, location_id, created_at")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: true });

    if (tlError) return serverError(tlError);
    if (!tlRows || tlRows.length === 0) return ok({ data: [] });

    // Step 2: fetch location details for those IDs
    const locationIds = tlRows.map((r) => r.location_id as string);
    const { data: locRows, error: locError } = await db
      .from("locations")
      .select("id, name, color")
      .in("id", locationIds);

    if (locError) return serverError(locError);

    const locMap = new Map((locRows ?? []).map((l) => [l.id as string, l]));

    const data = tlRows.map((tl) => ({
      id: tl.id,
      location_id: tl.location_id,
      created_at: tl.created_at,
      location: locMap.get(tl.location_id as string) ?? null,
    }));

    return ok({ data });
  } catch (err) {
    return serverError(err);
  }
}

/**
 * POST /api/crm/teachers/[id]/locations
 * Body: { location_id: string }
 * Adds a location assignment for the teacher.
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id: teacherId } = await ctx.params;
    let body: { location_id?: string } | null = null;
    try {
      body = (await req.json()) as { location_id?: string };
    } catch {
      return badRequest("INVALID_BODY");
    }
    if (!body?.location_id) {
      return badRequest("MISSING_LOCATION_ID");
    }
    const db = getServiceClient();

    // Check for existing assignment to avoid duplicates
    const { data: existing } = await db
      .from("teacher_locations")
      .select("id")
      .eq("teacher_id", teacherId)
      .eq("location_id", body.location_id)
      .maybeSingle();

    if (existing) {
      return ok({ data: existing });
    }

    const { data, error } = await db
      .from("teacher_locations")
      .insert({ teacher_id: teacherId, location_id: body.location_id })
      .select("id, location_id, created_at")
      .single();

    if (error) return serverError(error);

    // Fetch location details
    const { data: loc } = await db
      .from("locations")
      .select("id, name, color")
      .eq("id", body.location_id)
      .maybeSingle();

    return ok({ data: { ...data, location: loc ?? null } });
  } catch (err) {
    return serverError(err);
  }
}

/**
 * DELETE /api/crm/teachers/[id]/locations/[locationId]
 * Removes a location assignment for the teacher.
 * Handled in the [locationId] sub-route.
 */

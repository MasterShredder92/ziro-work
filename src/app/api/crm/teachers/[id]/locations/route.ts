import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { badRequest, ok, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/crm/teachers/[id]/locations
 * Returns all location assignments for the teacher, with location name/color/is_regular/can_sub.
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
    const { data: tlRows, error: tlError } = await db
      .from("teacher_locations")
      .select("id, location_id, is_regular, can_sub, created_at")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: true });
    if (tlError) return serverError(tlError);
    if (!tlRows || tlRows.length === 0) return ok({ data: [] });
    const locationIds = tlRows.map((r) => r.location_id as string);
    const { data: locRows, error: locError } = await db
      .from("locations")
      .select("id, name, color, hours_json")
      .in("id", locationIds);
    if (locError) return serverError(locError);
    const locMap = new Map((locRows ?? []).map((l) => [l.id as string, l]));
    const data = tlRows.map((tl) => ({
      id: tl.id,
      location_id: tl.location_id,
      is_regular: tl.is_regular ?? false,
      can_sub: tl.can_sub ?? false,
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
 * Body: { location_id: string, is_regular?: boolean, can_sub?: boolean }
 * Upserts a location assignment for the teacher.
 */
export async function POST(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id: teacherId } = await ctx.params;
    let body: { location_id?: string; is_regular?: boolean; can_sub?: boolean } | null = null;
    try {
      body = (await req.json()) as { location_id?: string; is_regular?: boolean; can_sub?: boolean };
    } catch {
      return badRequest("INVALID_BODY");
    }
    if (!body?.location_id) return badRequest("MISSING_LOCATION_ID");
    const db = getServiceClient();
    const { data: existing } = await db
      .from("teacher_locations")
      .select("id")
      .eq("teacher_id", teacherId)
      .eq("location_id", body.location_id)
      .maybeSingle();
    let data, error;
    if (existing) {
      ({ data, error } = await db
        .from("teacher_locations")
        .update({ is_regular: body.is_regular ?? false, can_sub: body.can_sub ?? false })
        .eq("id", existing.id)
        .select("id, location_id, is_regular, can_sub, created_at")
        .single());
    } else {
      ({ data, error } = await db
        .from("teacher_locations")
        .insert({ teacher_id: teacherId, location_id: body.location_id, is_regular: body.is_regular ?? false, can_sub: body.can_sub ?? false })
        .select("id, location_id, is_regular, can_sub, created_at")
        .single());
    }
    if (error) return serverError(error);
    const { data: loc } = await db
      .from("locations")
      .select("id, name, color, hours_json")
      .eq("id", body.location_id)
      .maybeSingle();
    return ok({ data: { ...data, location: loc ?? null } });
  } catch (err) {
    return serverError(err);
  }
}

/**
 * PATCH /api/crm/teachers/[id]/locations
 * Body: { location_id: string, is_regular?: boolean, can_sub?: boolean }
 * Updates is_regular and/or can_sub for an existing assignment.
 */
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "director",
  });
  if ("response" in resolved) return resolved.response;
  try {
    const { id: teacherId } = await ctx.params;
    let body: { location_id?: string; is_regular?: boolean; can_sub?: boolean } | null = null;
    try {
      body = (await req.json()) as { location_id?: string; is_regular?: boolean; can_sub?: boolean };
    } catch {
      return badRequest("INVALID_BODY");
    }
    if (!body?.location_id) return badRequest("MISSING_LOCATION_ID");
    const db = getServiceClient();
    const patch: Record<string, unknown> = {};
    if (body.is_regular !== undefined) patch.is_regular = body.is_regular;
    if (body.can_sub !== undefined) patch.can_sub = body.can_sub;
    if (Object.keys(patch).length === 0) return badRequest("NO_FIELDS_TO_UPDATE");
    const { data, error } = await db
      .from("teacher_locations")
      .update(patch)
      .eq("teacher_id", teacherId)
      .eq("location_id", body.location_id)
      .select("id, location_id, is_regular, can_sub, created_at")
      .single();
    if (error) return serverError(error);
    return ok({ data });
  } catch (err) {
    return serverError(err);
  }
}

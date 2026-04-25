import { NextRequest } from "next/server";
import { ok, badRequest, serverError, created } from "@/lib/http";
import { forbidden, withScheduleAccess } from "../_utils";
import { clientFor } from "@data/_client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_DAYS = [
  "monday","tuesday","wednesday","thursday","friday","saturday","sunday",
] as const;
type DayOfWeek = (typeof VALID_DAYS)[number];

/**
 * GET /api/schedule/room-assignments?location_id=...&day_of_week=...
 * Returns recurring room assignments for a location+day (flat, no joins).
 * Root cause of previous 500: PGRST200 from embedded teacher join — no FK exists.
 * Fix: flat select only.
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await withScheduleAccess(req, "schedule.read");
    const url = new URL(req.url);
    const locationId = url.searchParams.get("location_id");
    const dayOfWeek = url.searchParams.get("day_of_week");
    const date = url.searchParams.get("date");

    if (!locationId) return badRequest("location_id required");

    const db = clientFor(tenantId);

    // Flat select — no embedded joins (no FK constraints on this table)
    let query = db
      .from("teacher_room_assignments")
      .select("id, teacher_id, room_id, location_id, assignment_date, day_of_week, is_recurring")
      .eq("location_id", locationId)
      .eq("tenant_id", tenantId);

    if (dayOfWeek && VALID_DAYS.includes(dayOfWeek as DayOfWeek)) {
      if (date) {
        query = query.or(
          `and(is_recurring.eq.true,day_of_week.eq.${dayOfWeek}),and(is_recurring.eq.false,assignment_date.eq.${date})`,
        );
      } else {
        query = query.eq("day_of_week", dayOfWeek).eq("is_recurring", true);
      }
    }

    const { data, error } = await query;
    if (error) return serverError(error);

    return ok({ data: data ?? [], count: (data ?? []).length });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

/**
 * POST /api/schedule/room-assignments
 * Upsert a recurring teacher→room assignment.
 * Enforces: one teacher per room per day, one room per teacher per location per day.
 * Uses DELETE+INSERT to avoid unique constraint conflicts.
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await withScheduleAccess(req, "schedule.write");
    const body = await req.json().catch(() => null);

    if (!body) return badRequest("Invalid JSON body");

    const { teacher_id, room_id, location_id, day_of_week, is_recurring = true, assignment_date } = body as {
      teacher_id?: string;
      room_id?: string;
      location_id?: string;
      day_of_week?: string;
      is_recurring?: boolean;
      assignment_date?: string;
    };

    if (!teacher_id || !room_id || !location_id)
      return badRequest("teacher_id, room_id, and location_id are required");

    if (is_recurring && !day_of_week)
      return badRequest("day_of_week is required for recurring assignments");

    if (day_of_week && !VALID_DAYS.includes(day_of_week as DayOfWeek))
      return badRequest(`day_of_week must be one of: ${VALID_DAYS.join(", ")}`);

    const db = clientFor(tenantId);

    if (is_recurring && day_of_week) {
      // Remove any existing assignment for this teacher on this day at this location
      // (teacher moving to a different room, or re-assigning same room)
      await db
        .from("teacher_room_assignments")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("teacher_id", teacher_id)
        .eq("location_id", location_id)
        .eq("day_of_week", day_of_week)
        .eq("is_recurring", true);

      // Remove any existing assignment for this room on this day
      // (a different teacher was previously in this room)
      await db
        .from("teacher_room_assignments")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("room_id", room_id)
        .eq("location_id", location_id)
        .eq("day_of_week", day_of_week)
        .eq("is_recurring", true);
    }

    // Insert the new assignment (clean slate after deletes above)
    const { data, error } = await db
      .from("teacher_room_assignments")
      .insert({
        tenant_id: tenantId,
        teacher_id,
        room_id,
        location_id,
        day_of_week: day_of_week ?? null,
        is_recurring,
        assignment_date: assignment_date ?? null,
      })
      .select()
      .single();

    if (error) return serverError(error);

    return created({ data });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

/**
 * DELETE /api/schedule/room-assignments?room_id=...&location_id=...&day_of_week=...
 * Remove a recurring assignment for a specific room+day.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { tenantId } = await withScheduleAccess(req, "schedule.write");
    const url = new URL(req.url);
    const roomId = url.searchParams.get("room_id");
    const locationId = url.searchParams.get("location_id");
    const dayOfWeek = url.searchParams.get("day_of_week");

    if (!roomId || !locationId || !dayOfWeek)
      return badRequest("room_id, location_id, and day_of_week required");

    const db = clientFor(tenantId);
    const { error } = await db
      .from("teacher_room_assignments")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("room_id", roomId)
      .eq("location_id", locationId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_recurring", true);

    if (error) return serverError(error);

    return ok({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") return forbidden();
    return serverError(err);
  }
}

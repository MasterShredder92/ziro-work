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
 * Returns recurring room assignments for a location+day.
 * Also returns date-specific assignments for ?date=YYYY-MM-DD
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

    // Build query — fetch recurring assignments for this location+day
    // and any date-specific overrides for the given date
    let query = db
      .from("teacher_room_assignments")
      .select(
        `id, teacher_id, room_id, location_id, assignment_date, day_of_week, is_recurring,
         teacher:teacher_id ( id, name, instruments )`,
      )
      .eq("location_id", locationId);

    if (dayOfWeek && VALID_DAYS.includes(dayOfWeek as DayOfWeek)) {
      // Return recurring assignments for this day OR date-specific for the given date
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
 * Upsert a recurring teacher→room assignment for a location+day.
 * One teacher per room per day. One room per teacher per location per day.
 */
export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await withScheduleAccess(req, "schedule.write");
    const body = await req.json().catch(() => null);

    if (!body) return badRequest("Invalid JSON body");

    const { teacher_id, room_id, location_id, day_of_week, is_recurring = true, assignment_date } = body;

    if (!teacher_id || !room_id || !location_id)
      return badRequest("teacher_id, room_id, and location_id are required");

    if (is_recurring && !day_of_week)
      return badRequest("day_of_week is required for recurring assignments");

    if (day_of_week && !VALID_DAYS.includes(day_of_week as DayOfWeek))
      return badRequest(`day_of_week must be one of: ${VALID_DAYS.join(", ")}`);

    const db = clientFor(tenantId);

    // Check: teacher already assigned to a different room on this day at this location
    if (is_recurring && day_of_week) {
      const { data: existingTeacher } = await db
        .from("teacher_room_assignments")
        .select("id, room_id")
        .eq("tenant_id", tenantId)
        .eq("teacher_id", teacher_id)
        .eq("location_id", location_id)
        .eq("day_of_week", day_of_week)
        .eq("is_recurring", true)
        .neq("room_id", room_id)
        .limit(1);

      if (existingTeacher && existingTeacher.length > 0) {
        // Remove old assignment before creating new one (teacher moved rooms)
        await db
          .from("teacher_room_assignments")
          .delete()
          .eq("id", existingTeacher[0].id);
      }

      // Upsert: if this room already has a different teacher on this day, replace them
      const { data: existingRoom } = await db
        .from("teacher_room_assignments")
        .select("id, teacher_id")
        .eq("tenant_id", tenantId)
        .eq("room_id", room_id)
        .eq("location_id", location_id)
        .eq("day_of_week", day_of_week)
        .eq("is_recurring", true)
        .neq("teacher_id", teacher_id)
        .limit(1);

      if (existingRoom && existingRoom.length > 0) {
        await db
          .from("teacher_room_assignments")
          .delete()
          .eq("id", existingRoom[0].id);
      }
    }

    // Insert the new assignment
    const { data, error } = await db
      .from("teacher_room_assignments")
      .upsert(
        {
          tenant_id: tenantId,
          teacher_id,
          room_id,
          location_id,
          day_of_week: day_of_week ?? null,
          is_recurring,
          assignment_date: assignment_date ?? null,
        },
        {
          onConflict: is_recurring && day_of_week
            ? "tenant_id,location_id,room_id,day_of_week"
            : "id",
          ignoreDuplicates: false,
        },
      )
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
 * Remove a recurring assignment.
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

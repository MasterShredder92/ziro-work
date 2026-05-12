import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { ok, serverError } from "@/lib/http";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isActiveTeacher(row: {
  is_active?: boolean | null;
  archived_at?: string | null;
  status?: string | null;
}): boolean {
  if (row.archived_at) return false;
  if (row.is_active === false) return false;
  if ((row.status ?? "").toLowerCase() === "inactive") return false;
  return true;
}

function w9Complete(row: {
  needs_1099?: boolean | null;
  w9_status?: string | null;
  w9_completed_at?: string | null;
}): boolean {
  if (!row.needs_1099) return true;
  const s = (row.w9_status ?? "").toLowerCase();
  if (s === "complete" || s === "signed") return true;
  return Boolean(row.w9_completed_at);
}

function contractComplete(row: {
  contract_status?: string | null;
  contract_signed_at?: string | null;
}): boolean {
  const s = (row.contract_status ?? "").toLowerCase();
  if (s === "signed" || s === "complete") return true;
  return Boolean(row.contract_signed_at);
}

/**
 * GET /api/dashboard/teachers-overview?locationId=optional
 *
 * Staffing + compliance snapshot for the Teachers dashboard tile.
 */
export async function GET(req: NextRequest) {
  try {
    const tenantId = await getCRMTenantId();
    const db = getServiceClient();
    const url = new URL(req.url);
    const locationId = url.searchParams.get("locationId")?.trim() || null;

    let activeStudentsQ = db
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", "active");
    if (locationId) activeStudentsQ = activeStudentsQ.eq("location_id", locationId);

    let roomsQ = db
      .from("rooms")
      .select("id, location_id")
      .eq("tenant_id", tenantId)
      .is("archived_at", null)
      .or("is_active.eq.true,is_active.is.null");
    if (locationId) roomsQ = roomsQ.eq("location_id", locationId);

    const teachersQ = db
      .from("teachers")
      .select(
        "id, needs_1099, w9_status, w9_completed_at, contract_status, contract_signed_at, is_active, archived_at, status",
      )
      .eq("tenant_id", tenantId);

    const [activeStudentsRes, roomsRes, teachersRes, assignAtLocRes, studentsTeachersRes] =
      await Promise.all([
        activeStudentsQ,
        roomsQ,
        teachersQ,
        locationId
          ? db
              .from("teacher_room_assignments")
              .select("teacher_id")
              .eq("tenant_id", tenantId)
              .eq("location_id", locationId)
              .not("teacher_id", "is", null)
          : Promise.resolve({ data: [] as { teacher_id: string }[], error: null }),
        locationId
          ? db
              .from("students")
              .select("teacher_id")
              .eq("tenant_id", tenantId)
              .eq("location_id", locationId)
              .eq("status", "active")
              .not("teacher_id", "is", null)
          : Promise.resolve({ data: [] as { teacher_id: string }[], error: null }),
      ]);

    if (activeStudentsRes.error) throw activeStudentsRes.error;
    if (roomsRes.error) throw roomsRes.error;
    if (teachersRes.error) throw teachersRes.error;
    if (assignAtLocRes.error) throw assignAtLocRes.error;
    if (studentsTeachersRes.error) throw studentsTeachersRes.error;

    const roomRows = roomsRes.data ?? [];
    const roomIds = roomRows.map((r) => String(r.id)).filter(Boolean);

    let staffedRoomIds = new Set<string>();
    if (roomIds.length > 0) {
      const { data: assignRows, error: arErr } = await db
        .from("teacher_room_assignments")
        .select("room_id, teacher_id")
        .eq("tenant_id", tenantId)
        .not("teacher_id", "is", null)
        .in("room_id", roomIds);
      if (arErr) throw arErr;
      for (const row of assignRows ?? []) {
        if (row.room_id) staffedRoomIds.add(String(row.room_id));
      }
    }

    const teachersNeeded = roomIds.filter((id) => !staffedRoomIds.has(id)).length;

    const teacherRows = teachersRes.data ?? [];
    const activeTeachers = teacherRows.filter(isActiveTeacher);

    const atLocationIds = new Set<string>();
    if (locationId) {
      for (const r of assignAtLocRes.data ?? []) {
        if (r.teacher_id) atLocationIds.add(String(r.teacher_id));
      }
      for (const r of studentsTeachersRes.data ?? []) {
        if (r.teacher_id) atLocationIds.add(String(r.teacher_id));
      }
    }

    const compliancePool = locationId
      ? activeTeachers.filter((t) => atLocationIds.has(String(t.id)))
      : activeTeachers;

    const withGaps = new Set<string>();
    let missingW9 = 0;
    let missingContract = 0;
    for (const t of compliancePool) {
      const id = String(t.id);
      const w9Bad = !w9Complete(t);
      const cBad = !contractComplete(t);
      if (w9Bad) missingW9++;
      if (cBad) missingContract++;
      if (w9Bad || cBad) withGaps.add(id);
    }

    return ok({
      activeStudents: activeStudentsRes.count ?? 0,
      teachersNeeded,
      activeRooms: roomIds.length,
      teachersWithComplianceGaps: withGaps.size,
      missingW9Teachers: missingW9,
      missingContractTeachers: missingContract,
    });
  } catch (err) {
    return serverError(err);
  }
}

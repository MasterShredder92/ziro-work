import { NextRequest } from "next/server";
import { badRequest, ok, serverError } from "@/lib/http";
import { withScheduleAccess } from "../../schedule/_utils";
import { assertLocationAllowed } from "@/lib/auth/locationAccess";
import { clampWindowLength } from "@/lib/schedule/window";
import { loadWindowedScheduleData } from "@/lib/schedule/windowedData";
import { projectBlocksForWindow } from "@/lib/schedule/windowedClient";
import { getServiceClient } from "@/lib/supabase";
import type { StudentStatus } from "@/lib/data/models/students";

function validIsoDate(value: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function mapStatus(raw: string): StudentStatus {
  const s = raw.trim().toLowerCase();
  if (s === "active" || s === "paused" || s === "inactive") return s;
  if (s === "enrolled" || s === "prospect" || s === "trial") return "active";
  return "inactive";
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type StudioMapRosterStudent = {
  id: string;
  name: string;
  status: StudentStatus;
};

export async function GET(req: NextRequest) {
  try {
    const { tenantId, locationAccess } = await withScheduleAccess(req, "schedule.read");
    const url = new URL(req.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    const teacherId = url.searchParams.get("teacherId")?.trim() ?? "";
    const locationIdParam = url.searchParams.get("locationId")?.trim() ?? "";

    if (!validIsoDate(start) || !validIsoDate(end)) {
      return badRequest("INVALID_WINDOW");
    }
    if (!clampWindowLength({ start, end }, 14)) {
      return badRequest("WINDOW_TOO_LARGE", { maxDays: 14 });
    }
    if (!teacherId) {
      return badRequest("MISSING_TEACHER_ID");
    }

    const locationId = assertLocationAllowed(locationAccess, locationIdParam || null);
    if (!locationId) {
      return badRequest("MISSING_LOCATION_ID");
    }

    const data = await loadWindowedScheduleData({
      tenantId,
      locationId,
      start,
      end,
      includeRooms: false,
      includeStudents: false,
    });

    const projected = projectBlocksForWindow(data.blocks, start, end);
    const studentIds = new Set<string>();
    for (const b of projected) {
      if (b.teacher_id !== teacherId) continue;
      if (!b.student_id) continue;
      if (b.block_type === "open_time") continue;
      if (b.block_type === "call_out" || b.callout_id || b.is_family_callout) continue;
      studentIds.add(b.student_id);
    }

    if (studentIds.size === 0) {
      return ok({ students: [] as StudioMapRosterStudent[] });
    }

    const supabase = getServiceClient();
    const { data: rows, error } = await supabase
      .from("students")
      .select("id, first_name, last_name, status")
      .eq("tenant_id", tenantId)
      .in("id", [...studentIds]);

    if (error) throw new Error(error.message);

    const students: StudioMapRosterStudent[] = (rows ?? []).map((row) => {
      const name = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "Student";
      return {
        id: row.id,
        name,
        status: mapStatus(row.status ?? "inactive"),
      };
    });

    students.sort((a, b) => a.name.localeCompare(b.name));

    return ok({ students });
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
        status: 403,
        headers: { "content-type": "application/json" },
      });
    }
    return serverError(err);
  }
}

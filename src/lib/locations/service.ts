import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { computeConflicts } from "@/lib/scheduling/queries";
import type { ScheduleBlock } from "@/lib/types/entities";
import {
  getLocationById,
  getLocationSchedule,
  getRoomById,
  getRoomSchedule,
  listRooms,
} from "./queries";
import type {
  LocationDashboardData,
  LocationKpis,
  LocationRange,
  LocationScheduleSummary,
  RoomScheduleSummary,
  RoomSurfaceData,
} from "./types";

function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const parts = t.split(":");
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function durationMinutes(block: ScheduleBlock): number {
  const start = parseTimeToMinutes(block.start_time);
  const end = parseTimeToMinutes(block.end_time);
  if (start === null || end === null) return 0;
  return Math.max(0, end - start);
}

function defaultRange(): LocationRange {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 13);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

async function resolveTenantId(): Promise<string> {
  const session = await getSession();
  return session?.tenantId?.trim() || DEFAULT_TENANT_ID;
}

function countDistinct(values: (string | null | undefined)[]): number {
  const set = new Set<string>();
  for (const v of values) if (v) set.add(v);
  return set.size;
}

function computeRoomSummary(
  room: { id: string; name: string; location_id: string | null },
  blocks: ScheduleBlock[],
  tenantId: string,
  range: LocationRange,
): RoomScheduleSummary {
  const roomBlocks = blocks.filter((b) => b.room_id === room.id);
  const totalMinutes = roomBlocks.reduce(
    (sum, b) => sum + durationMinutes(b),
    0,
  );
  const maxMinutesInWindow = 7 * 24 * 60;
  const utilizationPct = Math.min(
    100,
    Math.round((totalMinutes / maxMinutesInWindow) * 100),
  );
  return {
    roomId: room.id,
    roomName: room.name,
    tenantId,
    locationId: room.location_id ?? null,
    range,
    totalBlocks: roomBlocks.length,
    totalMinutes,
    utilizationPct,
    uniqueTeacherCount: countDistinct(roomBlocks.map((b) => b.teacher_id)),
    uniqueStudentCount: countDistinct(roomBlocks.map((b) => b.student_id)),
  };
}

export async function getLocationDashboard(
  locationId: string,
  range?: LocationRange,
): Promise<LocationDashboardData> {
  const tenantId = await resolveTenantId();
  await assertTenantAccess(tenantId);

  const location = await getLocationById(locationId, tenantId);
  if (!location) throw new Error("LOCATION_NOT_FOUND");
  if (location.tenant_id !== tenantId) {
    throw new Error("TENANT_MISMATCH");
  }

  const resolvedRange = range ?? defaultRange();

  const [rooms, blocks] = await Promise.all([
    listRooms(locationId, tenantId),
    getLocationSchedule(locationId, tenantId, resolvedRange),
  ]);

  const roomSummaries = rooms.map((room) =>
    computeRoomSummary(room, blocks, tenantId, resolvedRange),
  );

  const totalMinutes = blocks.reduce(
    (sum, b) => sum + durationMinutes(b),
    0,
  );
  const weeklyHours = Math.round((totalMinutes / 60) * 10) / 10;

  const avgUtilization =
    roomSummaries.length > 0
      ? Math.round(
          roomSummaries.reduce((s, r) => s + r.utilizationPct, 0) /
            roomSummaries.length,
        )
      : 0;

  const conflicts = computeConflicts(blocks);

  const scheduleSummary: LocationScheduleSummary = {
    locationId,
    tenantId,
    range: resolvedRange,
    totalBlocks: blocks.length,
    totalMinutes,
    weeklyHours,
    uniqueTeacherCount: countDistinct(blocks.map((b) => b.teacher_id)),
    uniqueStudentCount: countDistinct(blocks.map((b) => b.student_id)),
    roomSummaries,
  };

  const kpis: LocationKpis = {
    totalTeachers: scheduleSummary.uniqueTeacherCount,
    totalStudents: scheduleSummary.uniqueStudentCount,
    totalRooms: rooms.length,
    activeRooms: rooms.filter((r) => r.is_active !== false).length,
    weeklyScheduleLoadHours: weeklyHours,
    averageRoomUtilizationPct: avgUtilization,
    conflicts: conflicts.length,
  };

  const today = new Date().toISOString().slice(0, 10);
  const upcomingBlocks = blocks
    .filter((b) => (b.block_date ?? "") >= today)
    .sort((a, b) => {
      const da = a.block_date ?? "";
      const db = b.block_date ?? "";
      if (da !== db) return da.localeCompare(db);
      const ta = a.start_time ?? "";
      const tb = b.start_time ?? "";
      return ta.localeCompare(tb);
    })
    .slice(0, 25);

  return {
    location,
    rooms,
    kpis,
    scheduleSummary,
    upcomingBlocks,
    generatedAt: new Date().toISOString(),
  };
}

export async function getRoomSurface(
  roomId: string,
  range?: LocationRange,
): Promise<RoomSurfaceData> {
  const tenantId = await resolveTenantId();
  await assertTenantAccess(tenantId);

  const room = await getRoomById(roomId, tenantId);
  if (!room) throw new Error("ROOM_NOT_FOUND");
  if (room.tenant_id && room.tenant_id !== tenantId) {
    throw new Error("TENANT_MISMATCH");
  }

  const resolvedRange = range ?? defaultRange();

  const [location, blocks] = await Promise.all([
    room.location_id
      ? getLocationById(room.location_id, tenantId)
      : Promise.resolve(null),
    getRoomSchedule(roomId, tenantId, resolvedRange),
  ]);

  const summary = computeRoomSummary(
    { id: room.id, name: room.name, location_id: room.location_id ?? null },
    blocks,
    tenantId,
    resolvedRange,
  );

  const today = new Date().toISOString().slice(0, 10);
  const upcomingBlocks = blocks
    .filter((b) => (b.block_date ?? "") >= today)
    .sort((a, b) => {
      const da = a.block_date ?? "";
      const db = b.block_date ?? "";
      if (da !== db) return da.localeCompare(db);
      const ta = a.start_time ?? "";
      const tb = b.start_time ?? "";
      return ta.localeCompare(tb);
    })
    .slice(0, 25);

  return {
    room,
    location,
    summary,
    upcomingBlocks,
    generatedAt: new Date().toISOString(),
  };
}

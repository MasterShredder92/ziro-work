import { NextRequest } from "next/server";
import type { Session } from "@/lib/auth/session";
import {
  assertTenantAccess,
  requirePermission,
} from "@/lib/auth/guards";
import {
  assertLocationAllowed,
  resolveUserLocationAccess,
} from "@/lib/auth/locationAccess";
import type { LessonEventInsert } from "@/lib/schedule/types";

export function forbidden(): Response {
  return new Response(JSON.stringify({ error: "FORBIDDEN" }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

export function conflict(details: unknown): Response {
  return new Response(
    JSON.stringify({ error: "SCHEDULE_CONFLICT", details }),
    {
      status: 409,
      headers: { "content-type": "application/json" },
    },
  );
}

export async function readJsonSafe<T = unknown>(
  req: NextRequest,
): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export function resolveTenantFromRequest(
  req: NextRequest,
  session: Session,
): string {
  const header = req.headers.get("x-tenant-id");
  if (header && header.trim()) return header.trim();
  const url = new URL(req.url);
  const q = url.searchParams.get("tenantId");
  if (q && q.trim()) return q.trim();
  return session.tenantId;
}

export async function withScheduleAccess(
  req: NextRequest,
  perm: "schedule.read" | "schedule.write",
): Promise<{
  session: Session;
  tenantId: string;
  locationAccess: Awaited<ReturnType<typeof resolveUserLocationAccess>>;
}> {
  const session = await requirePermission(perm)();
  const tenantId = resolveTenantFromRequest(req, session);
  await assertTenantAccess(tenantId);
  const url = new URL(req.url);
  const preferredLocationId = url.searchParams.get("locationId");
  const locationAccess = await resolveUserLocationAccess({
    session: { ...session, tenantId },
    preferredLocationId,
    autoRepairProfileLocation: true,
  });
  return { session, tenantId, locationAccess };
}

export function resolveRequestedLocationId(
  req: NextRequest,
  access: Awaited<ReturnType<typeof resolveUserLocationAccess>>,
  options?: { required?: boolean; paramName?: string; allowFallback?: boolean },
): string | null {
  const paramName = options?.paramName ?? "locationId";
  const allowFallback = options?.allowFallback !== false;
  const requested = new URL(req.url).searchParams.get(paramName);
  if (requested && requested.trim().length > 0) {
    return assertLocationAllowed(access, requested);
  }
  if (allowFallback) {
    return access.selectedLocationId;
  }
  if (options?.required) throw new Error("FORBIDDEN");
  return null;
}

export function parseEventInput(
  body: unknown,
): Partial<LessonEventInsert> | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const out: Partial<LessonEventInsert> = {};
  const assignString = (key: keyof LessonEventInsert, value: unknown) => {
    if (typeof value === "string") (out as Record<string, unknown>)[key] = value;
    else if (value === null) (out as Record<string, unknown>)[key] = null;
  };
  if (typeof b.title === "string") out.title = b.title;
  if (typeof b.kind === "string") out.kind = b.kind as LessonEventInsert["kind"];
  if (typeof b.status === "string")
    out.status = b.status as LessonEventInsert["status"];
  assignString("teacherId", b.teacherId);
  assignString("studentId", b.studentId);
  assignString("familyId", b.familyId);
  assignString("roomId", b.roomId);
  assignString("locationId", b.locationId);
  if (typeof b.startTime === "string") out.startTime = b.startTime;
  if (typeof b.endTime === "string") out.endTime = b.endTime;
  if (typeof b.recurrenceId === "string" || b.recurrenceId === null)
    out.recurrenceId = b.recurrenceId as string | null;
  if (typeof b.notes === "string" || b.notes === null)
    out.notes = b.notes as string | null;
  if (typeof b.color === "string" || b.color === null)
    out.color = b.color as string | null;
  if (typeof b.createdBy === "string" || b.createdBy === null)
    out.createdBy = b.createdBy as string | null;
  return out;
}

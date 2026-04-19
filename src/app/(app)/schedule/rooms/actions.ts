"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveScheduleContext } from "../guard";
import {
  createScheduleRoom,
  deleteScheduleRoom,
  updateScheduleRoom,
} from "@data/scheduleRooms";
import { assignRoomToEvent } from "@/lib/schedule/bookings";
import { logAudit } from "@/lib/audit/log";

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function num(form: FormData, key: string, fallback: number): number {
  const v = form.get(key);
  const n = typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function list(form: FormData, key: string): string[] {
  const v = str(form, key);
  if (!v) return [];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createRoomAction(form: FormData): Promise<void> {
  const ctx = await resolveScheduleContext({ requireWrite: true });
  const room = await createScheduleRoom(ctx.tenantId, {
    tenantId: ctx.tenantId,
    name: str(form, "name") || "Room",
    capacity: num(form, "capacity", 1),
    locationId: str(form, "locationId") || null,
    equipment: list(form, "equipment"),
    roomType: str(form, "roomType") || null,
    bookingRules: null,
    isActive: true,
  });
  await logAudit("schedule.rooms.ui.create", {
    tenantId: ctx.tenantId,
    profileId: ctx.session.userId,
    roomId: room.id,
  });
  revalidatePath("/schedule/rooms");
}

export async function updateRoomAction(
  roomId: string,
  form: FormData,
): Promise<void> {
  const ctx = await resolveScheduleContext({ requireWrite: true });
  await updateScheduleRoom(roomId, ctx.tenantId, {
    name: str(form, "name") || undefined,
    capacity: num(form, "capacity", 0) || undefined,
    locationId: str(form, "locationId") || null,
    equipment: list(form, "equipment"),
    roomType: str(form, "roomType") || null,
    isActive: form.get("isActive") !== null,
  });
  revalidatePath(`/schedule/rooms/${roomId}`);
  revalidatePath("/schedule/rooms");
}

export async function deleteRoomAction(roomId: string): Promise<void> {
  const ctx = await resolveScheduleContext({ requireWrite: true });
  await deleteScheduleRoom(roomId, ctx.tenantId);
  revalidatePath("/schedule/rooms");
  redirect("/schedule/rooms");
}

export async function bookRoomAction(
  roomId: string,
  form: FormData,
): Promise<void> {
  const ctx = await resolveScheduleContext({ requireWrite: true });
  const eventId = str(form, "eventId");
  if (!eventId) return;
  await assignRoomToEvent(ctx.tenantId, eventId, roomId, {
    allowConflict: form.get("allowConflict") !== null,
    bookedBy: ctx.session.userId ?? null,
  });
  revalidatePath(`/schedule/rooms/${roomId}`);
}

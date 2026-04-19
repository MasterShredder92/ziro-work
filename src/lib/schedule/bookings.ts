import {
  createRoomBooking,
  deleteRoomBooking,
  listRoomBookings,
} from "@data/roomBookings";
import { listScheduleRooms } from "@data/scheduleRooms";
import { listLessonEvents, updateLessonEvent } from "@data/lessonEvents";
import type {
  LessonEvent,
  RoomBooking,
  ScheduleRoom,
  ScheduleSuggestion,
} from "./types";

function overlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Assign a room to an event. Creates the room booking record and updates the
 * event.roomId. Throws a SCHEDULE_CONFLICT if the room is already booked
 * during the event window unless `allowConflict` is set.
 */
export async function assignRoomToEvent(
  tenantId: string,
  eventId: string,
  roomId: string,
  opts?: { allowConflict?: boolean; bookedBy?: string | null },
): Promise<{ booking: RoomBooking; event: LessonEvent }> {
  const events = await listLessonEvents(tenantId, undefined, { limit: 2000 });
  const event = events.find((e) => e.id === eventId);
  if (!event) throw new Error(`lesson_event ${eventId} not found`);

  if (!opts?.allowConflict) {
    const existing = await listRoomBookings(
      tenantId,
      {
        room_id: roomId,
        start_from: new Date(
          new Date(event.startTime).getTime() - 24 * 60 * 60 * 1000,
        ).toISOString(),
        start_to: new Date(
          new Date(event.endTime).getTime() + 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      { limit: 500 },
    );
    const conflicting = existing.find(
      (b) =>
        b.eventId !== event.id &&
        overlap(event.startTime, event.endTime, b.startTime, b.endTime),
    );
    if (conflicting) {
      const err = new Error("Room has conflicting booking(s).") as Error & {
        code?: string;
        conflicts?: RoomBooking[];
      };
      err.code = "SCHEDULE_CONFLICT";
      err.conflicts = [conflicting];
      throw err;
    }
  }

  const booking = await createRoomBooking(tenantId, {
    tenantId,
    roomId,
    eventId: event.id,
    startTime: event.startTime,
    endTime: event.endTime,
    bookedBy: opts?.bookedBy ?? null,
    purpose: event.title,
  });

  const updatedEvent = await updateLessonEvent(event.id, tenantId, {
    roomId,
  });

  return { booking, event: updatedEvent };
}

export async function releaseRoomBooking(
  tenantId: string,
  bookingId: string,
): Promise<void> {
  await deleteRoomBooking(bookingId, tenantId);
}

/**
 * Suggest alternative rooms for an event window. Returns rooms with no
 * existing bookings that overlap, scored by capacity/equipment match.
 */
export async function suggestRoomsForEvent(
  tenantId: string,
  event: Pick<LessonEvent, "id" | "startTime" | "endTime" | "kind">,
  preferences?: {
    minCapacity?: number;
    requiredEquipment?: string[];
    limit?: number;
  },
): Promise<ScheduleSuggestion[]> {
  const rooms = await listScheduleRooms(tenantId, { is_active: true });
  const bookings = await listRoomBookings(
    tenantId,
    {
      start_from: new Date(
        new Date(event.startTime).getTime() - 24 * 60 * 60 * 1000,
      ).toISOString(),
      start_to: new Date(
        new Date(event.endTime).getTime() + 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    { limit: 2000 },
  );

  const bookingsByRoom = new Map<string, RoomBooking[]>();
  for (const b of bookings) {
    const arr = bookingsByRoom.get(b.roomId) ?? [];
    arr.push(b);
    bookingsByRoom.set(b.roomId, arr);
  }

  const suggestions: ScheduleSuggestion[] = [];
  for (const room of rooms) {
    const conflicts = (bookingsByRoom.get(room.id) ?? []).filter(
      (b) =>
        b.eventId !== event.id &&
        overlap(event.startTime, event.endTime, b.startTime, b.endTime),
    );
    if (conflicts.length > 0) continue;

    const score = scoreRoom(room, preferences);
    if (score < 0) continue;
    suggestions.push({
      teacherId: null,
      roomId: room.id,
      startTime: event.startTime,
      endTime: event.endTime,
      score,
      rationale: `${room.name} available · capacity ${room.capacity}`,
    });
  }

  suggestions.sort((a, b) => b.score - a.score);
  return suggestions.slice(0, preferences?.limit ?? 10);
}

function scoreRoom(
  room: ScheduleRoom,
  preferences?: {
    minCapacity?: number;
    requiredEquipment?: string[];
  },
): number {
  let score = 50;
  if (preferences?.minCapacity !== undefined) {
    if (room.capacity < preferences.minCapacity) return -1;
    score += Math.min(30, (room.capacity - preferences.minCapacity) * 2);
  }
  if (preferences?.requiredEquipment && preferences.requiredEquipment.length > 0) {
    const set = new Set(room.equipment.map((e) => e.toLowerCase()));
    for (const required of preferences.requiredEquipment) {
      if (!set.has(required.toLowerCase())) return -1;
    }
    score += preferences.requiredEquipment.length * 5;
  }
  return score;
}

/**
 * Try to auto-resolve a room conflict by moving the newer booking to the
 * best-available alternative room.
 */
export async function autoResolveRoomConflict(
  tenantId: string,
  eventId: string,
): Promise<
  | { resolved: true; booking: RoomBooking; event: LessonEvent }
  | { resolved: false; reason: string }
> {
  const events = await listLessonEvents(tenantId, undefined, { limit: 2000 });
  const event = events.find((e) => e.id === eventId);
  if (!event) return { resolved: false, reason: "Event not found" };

  const suggestions = await suggestRoomsForEvent(tenantId, event, { limit: 1 });
  const pick = suggestions.find((s) => s.roomId && s.roomId !== event.roomId);
  if (!pick?.roomId) return { resolved: false, reason: "No alternative rooms" };

  const { booking, event: updated } = await assignRoomToEvent(
    tenantId,
    event.id,
    pick.roomId,
  );
  return { resolved: true, booking, event: updated };
}

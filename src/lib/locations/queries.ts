import "server-only";
import {
  getLocationById as getLocationByIdFacade,
  listLocations as listLocationsFacade,
} from "@data/locations";
import {
  getRoomById as getRoomByIdFacade,
  listRooms as listRoomsFacade,
} from "@data/rooms";
import { listScheduleBlocks } from "@data/scheduleBlocks";
import type { Location, Room, ScheduleBlock } from "@/lib/types/entities";
import type { LocationRange } from "./types";

export async function listLocations(tenantId: string): Promise<Location[]> {
  return listLocationsFacade(
    tenantId,
    { is_active: true },
    { orderBy: "name", ascending: true, limit: 500 },
  );
}

export async function getLocationById(
  locationId: string,
  tenantId: string,
): Promise<Location | null> {
  if (!locationId) return null;
  return getLocationByIdFacade(locationId, tenantId);
}

export async function listRooms(
  locationId: string,
  tenantId: string,
): Promise<Room[]> {
  if (!locationId) return [];
  return listRoomsFacade(
    tenantId,
    { location_id: locationId },
    { orderBy: "display_order", ascending: true, limit: 500 },
  );
}

export async function getRoomById(
  roomId: string,
  tenantId: string,
): Promise<Room | null> {
  if (!roomId) return null;
  return getRoomByIdFacade(roomId, tenantId);
}

export async function getLocationSchedule(
  locationId: string,
  tenantId: string,
  range: LocationRange,
): Promise<ScheduleBlock[]> {
  if (!locationId) return [];
  return listScheduleBlocks(
    tenantId,
    {
      location_id: locationId,
      date_from: range.start,
      date_to: range.end,
    },
    { orderBy: "block_date", ascending: true, limit: 5000 },
  );
}

export async function getRoomSchedule(
  roomId: string,
  tenantId: string,
  range: LocationRange,
): Promise<ScheduleBlock[]> {
  if (!roomId) return [];
  return listScheduleBlocks(
    tenantId,
    {
      room_id: roomId,
      date_from: range.start,
      date_to: range.end,
    },
    { orderBy: "block_date", ascending: true, limit: 5000 },
  );
}

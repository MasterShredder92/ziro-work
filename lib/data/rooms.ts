import type { Room, RoomInsert, RoomUpdate } from "@/lib/types/entities";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

const TABLE = "rooms";

export type RoomFilter = {
  location_id?: string;
  room_type?: string;
  status?: string;
  is_active?: boolean;
};

export async function listRooms(
  tenantId: string,
  filter?: RoomFilter,
  opts?: ListOptions,
): Promise<Room[]> {
  const supabase = await clientFor(tenantId);
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.location_id) query = query.eq("location_id", filter.location_id);
  if (filter?.room_type) query = query.eq("room_type", filter.room_type);
  if (filter?.status) query = query.eq("status", filter.status);
  if (typeof filter?.is_active === "boolean")
    query = query.eq("is_active", filter.is_active);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "display_order",
    ascending: opts?.ascending ?? true,
    limit: opts?.limit ?? 500,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as Room[];
}

export async function getRoomById(
  id: string,
  tenantId: string,
): Promise<Room | null> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Room | null;
}

export async function createRoom(
  tenantId: string,
  input: Omit<RoomInsert, "tenant_id">,
): Promise<Room> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, tenant_id: tenantId })
    .select("*")
    .single();
  if (error) throw error;
  return data as Room;
}

export async function updateRoom(
  id: string,
  tenantId: string,
  input: RoomUpdate,
): Promise<Room> {
  const supabase = await clientFor(tenantId);
  const patch = { ...input, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Room;
}

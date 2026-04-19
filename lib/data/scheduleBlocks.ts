import type {
  ScheduleBlock,
  ScheduleBlockInsert,
  ScheduleBlockUpdate,
} from "@/lib/types/entities";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

const TABLE = "schedule_blocks";

export type ScheduleBlockFilter = {
  teacher_id?: string;
  student_id?: string;
  location_id?: string;
  room_id?: string;
  date_from?: string;
  date_to?: string;
  block_type?: string;
  status?: string;
  is_recurring?: boolean;
};

export async function listScheduleBlocks(
  tenantId: string,
  filter?: ScheduleBlockFilter,
  opts?: ListOptions,
): Promise<ScheduleBlock[]> {
  const supabase = clientFor(tenantId);
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.teacher_id) query = query.eq("teacher_id", filter.teacher_id);
  if (filter?.student_id) query = query.eq("student_id", filter.student_id);
  if (filter?.location_id) query = query.eq("location_id", filter.location_id);
  if (filter?.room_id) query = query.eq("room_id", filter.room_id);
  if (filter?.block_type) query = query.eq("block_type", filter.block_type);
  if (filter?.status) query = query.eq("status", filter.status);
  if (typeof filter?.is_recurring === "boolean")
    query = query.eq("is_recurring", filter.is_recurring);
  if (filter?.date_from) query = query.gte("block_date", filter.date_from);
  if (filter?.date_to) query = query.lte("block_date", filter.date_to);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "block_date",
    ascending: opts?.ascending ?? true,
    limit: opts?.limit ?? 500,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as ScheduleBlock[];
}

export async function getScheduleBlockById(
  id: string,
  tenantId: string,
): Promise<ScheduleBlock | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as ScheduleBlock | null;
}

export async function createScheduleBlock(
  tenantId: string,
  input: Omit<ScheduleBlockInsert, "tenant_id">,
): Promise<ScheduleBlock> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, tenant_id: tenantId })
    .select("*")
    .single();
  if (error) throw error;
  return data as ScheduleBlock;
}

export async function updateScheduleBlock(
  id: string,
  tenantId: string,
  input: ScheduleBlockUpdate,
): Promise<ScheduleBlock> {
  const supabase = clientFor(tenantId);
  const patch = { ...input, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as ScheduleBlock;
}

export async function deleteScheduleBlock(
  id: string,
  tenantId: string,
): Promise<void> {
  const supabase = clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}

export async function findConflictingBlocks(
  tenantId: string,
  teacherId: string,
  blockDate: string,
  startTime: string,
  endTime: string,
  excludeBlockId?: string,
): Promise<ScheduleBlock[]> {
  const supabase = clientFor(tenantId);
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("teacher_id", teacherId)
    .eq("block_date", blockDate)
    .lt("start_time", endTime)
    .gt("end_time", startTime);

  if (excludeBlockId) query = query.neq("id", excludeBlockId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ScheduleBlock[];
}

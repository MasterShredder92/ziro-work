import type {
  SessionLog,
  SessionLogInsert,
  SessionLogUpdate,
} from "@/lib/types/entities";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

const TABLE = "session_log";

export type SessionLogFilter = {
  student_id?: string;
  teacher_id?: string;
  schedule_block_id?: string;
  location_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
};

export async function listSessionLog(
  tenantId: string,
  filter?: SessionLogFilter,
  opts?: ListOptions,
): Promise<SessionLog[]> {
  const supabase = clientFor(tenantId);
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.student_id) query = query.eq("student_id", filter.student_id);
  if (filter?.teacher_id) query = query.eq("teacher_id", filter.teacher_id);
  if (filter?.schedule_block_id)
    query = query.eq("schedule_block_id", filter.schedule_block_id);
  if (filter?.location_id) query = query.eq("location_id", filter.location_id);
  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.date_from) query = query.gte("block_date", filter.date_from);
  if (filter?.date_to) query = query.lte("block_date", filter.date_to);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "block_date",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as SessionLog[];
}

export async function getSessionLogById(
  id: string,
  tenantId: string,
): Promise<SessionLog | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as SessionLog | null;
}

export async function getSessionLogByBlockId(
  scheduleBlockId: string,
  tenantId: string,
): Promise<SessionLog | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("schedule_block_id", scheduleBlockId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as SessionLog | null;
}

export async function createSessionLog(
  tenantId: string,
  input: Omit<SessionLogInsert, "tenant_id">,
): Promise<SessionLog> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, tenant_id: tenantId })
    .select("*")
    .single();
  if (error) throw error;
  return data as SessionLog;
}

export async function updateSessionLog(
  id: string,
  tenantId: string,
  input: SessionLogUpdate,
): Promise<SessionLog> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .update(input)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as SessionLog;
}

export async function deleteSessionLog(
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

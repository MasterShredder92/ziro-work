import type {
  StudentFollowup,
  StudentFollowupInsert,
  StudentFollowupUpdate,
} from "@/lib/types/entities";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

const TABLE = "student_followups";

export type StudentFollowupFilter = {
  student_id?: string;
  family_id?: string;
  status?: string;
  due_from?: string;
  due_to?: string;
  reason?: string;
};

export async function listStudentFollowups(
  tenantId: string,
  filter?: StudentFollowupFilter,
  opts?: ListOptions,
): Promise<StudentFollowup[]> {
  const supabase = await clientFor(tenantId);
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.student_id) query = query.eq("student_id", filter.student_id);
  if (filter?.family_id) query = query.eq("family_id", filter.family_id);
  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.reason) query = query.eq("reason", filter.reason);
  if (filter?.due_from) query = query.gte("followup_date", filter.due_from);
  if (filter?.due_to) query = query.lte("followup_date", filter.due_to);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "followup_date",
    ascending: opts?.ascending ?? true,
    limit: opts?.limit ?? 100,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as StudentFollowup[];
}

export async function getStudentFollowupById(
  id: string,
  tenantId: string,
): Promise<StudentFollowup | null> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as StudentFollowup | null;
}

export async function createStudentFollowup(
  tenantId: string,
  input: Omit<StudentFollowupInsert, "tenant_id">,
): Promise<StudentFollowup> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, tenant_id: tenantId })
    .select("*")
    .single();
  if (error) throw error;
  return data as StudentFollowup;
}

export async function updateStudentFollowup(
  id: string,
  tenantId: string,
  input: StudentFollowupUpdate,
): Promise<StudentFollowup> {
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
  return data as StudentFollowup;
}

export async function markStudentFollowupSent(
  id: string,
  tenantId: string,
  sentBy: string,
): Promise<StudentFollowup> {
  return updateStudentFollowup(id, tenantId, {
    status: "sent",
    sent_at: new Date().toISOString(),
    sent_by: sentBy,
  } as StudentFollowupUpdate);
}

export async function deleteStudentFollowup(
  id: string,
  tenantId: string,
): Promise<void> {
  const supabase = await clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}

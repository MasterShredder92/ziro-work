import type {
  Enrollment,
  EnrollmentInsert,
  EnrollmentUpdate,
} from "@/lib/types/crm";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

const TABLE = "enrollments";

export type EnrollmentFilter = {
  student_id?: string;
  teacher_id?: string;
  status?: string;
};

/** Active enrollment counts per teacher (CRM teacher load column). */
export async function countActiveEnrollmentsByTeacherIds(
  tenantId: string,
  teacherIds: string[],
): Promise<Record<string, number>> {
  if (teacherIds.length === 0) return {};
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("teacher_id")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .in("teacher_id", teacherIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const id of teacherIds) counts[id] = 0;
  for (const row of data ?? []) {
    const tid = (row as { teacher_id?: string }).teacher_id;
    if (tid && counts[tid] !== undefined) counts[tid] += 1;
  }
  return counts;
}

/** All enrollment rows per teacher (any status). */
export async function countEnrollmentsByTeacherIds(
  tenantId: string,
  teacherIds: string[],
): Promise<Record<string, number>> {
  if (teacherIds.length === 0) return {};
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("teacher_id")
    .eq("tenant_id", tenantId)
    .in("teacher_id", teacherIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const id of teacherIds) counts[id] = 0;
  for (const row of data ?? []) {
    const tid = (row as { teacher_id?: string }).teacher_id;
    if (tid && counts[tid] !== undefined) counts[tid] += 1;
  }
  return counts;
}

export async function listEnrollments(
  tenantId: string,
  filter?: EnrollmentFilter,
  opts?: ListOptions,
): Promise<Enrollment[]> {
  const supabase = await clientFor(tenantId);
  let query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);

  if (filter?.student_id) query = query.eq("student_id", filter.student_id);
  if (filter?.teacher_id) query = query.eq("teacher_id", filter.teacher_id);
  if (filter?.status) query = query.eq("status", filter.status);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "created_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as Enrollment[];
}

export async function getEnrollmentById(
  id: string,
  tenantId: string,
): Promise<Enrollment | null> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Enrollment | null;
}

export async function createEnrollment(
  tenantId: string,
  input: Omit<EnrollmentInsert, "tenant_id">,
): Promise<Enrollment> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, tenant_id: tenantId })
    .select("*")
    .single();
  if (error) throw error;
  return data as Enrollment;
}

export async function updateEnrollment(
  id: string,
  tenantId: string,
  input: EnrollmentUpdate,
): Promise<Enrollment> {
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
  return data as Enrollment;
}

export async function deleteEnrollment(
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

export async function endEnrollment(
  id: string,
  tenantId: string,
  endDate: string,
): Promise<Enrollment> {
  return updateEnrollment(id, tenantId, {
    status: "ended",
    end_date: endDate,
  });
}

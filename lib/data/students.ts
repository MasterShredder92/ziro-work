import type {
  Student,
  StudentInsert,
  StudentUpdate,
} from "@/lib/types/entities";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

const TABLE = "students";

export type StudentFilter = {
  family_id?: string;
  teacher_id?: string;
  location_id?: string;
  status?: string;
  instrument?: string;
  enrollment_type?: string;
};

/**
 * Lessonpreneur stores `students.status` as free text (often Title Case).
 * The CRM filter sends lowercase buckets (`enrolled`, `active`, …) which
 * used to hit `.eq` and return zero rows. Map buckets to case-insensitive
 * OR groups; unknown values fall back to a single `ilike` (exact token, no wildcards).
 */
function applyLessonpreneurStatusFilter<
  T extends { or: (filter: string) => T; ilike: (col: string, pattern: string) => T },
>(query: T, status: string | undefined): T {
  const raw = typeof status === "string" ? status.trim() : "";
  if (!raw) return query;

  const key = raw.toLowerCase();
  const escapeIlikeToken = (token: string) =>
    token.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");

  const orFromTokens = (tokens: string[]) =>
    tokens.map((t) => `status.ilike.${escapeIlikeToken(t)}`).join(",");

  const bucket: Record<string, string[]> = {
    // "Enrolled" in the UI = on the roster, currently taking lessons
    enrolled: ["enrolled", "active", "current"],
    active: ["active", "current"],
    inactive: ["inactive", "former", "cancelled", "churned", "paused"],
    prospect: ["prospect", "lead", "trial", "inquiry"],
  };

  const tokens = bucket[key];
  if (tokens?.length) return query.or(orFromTokens(tokens));

  return query.ilike("status", escapeIlikeToken(raw));
}

export async function listStudents(
  tenantId: string,
  filter?: StudentFilter,
  opts?: ListOptions,
): Promise<Student[]> {
  const supabase = clientFor(tenantId);
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.family_id) query = query.eq("family_id", filter.family_id);
  if (filter?.teacher_id) query = query.eq("teacher_id", filter.teacher_id);
  if (filter?.location_id) query = query.eq("location_id", filter.location_id);
  if (filter?.status) query = applyLessonpreneurStatusFilter(query, filter.status);
  if (filter?.instrument) query = query.eq("instrument", filter.instrument);
  if (filter?.enrollment_type)
    query = query.eq("enrollment_type", filter.enrollment_type);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "created_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as Student[];
}

export async function getStudentsByIds(
  tenantId: string,
  ids: string[],
): Promise<Student[]> {
  if (ids.length === 0) return [];
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as Student[];
}

export async function getStudentById(
  id: string,
  tenantId: string,
): Promise<Student | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Student | null;
}

export async function createStudent(
  tenantId: string,
  input: Record<string, unknown> | Omit<StudentInsert, "tenant_id">,
): Promise<Student> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, tenant_id: tenantId } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as Student;
}

export async function updateStudent(
  id: string,
  tenantId: string,
  input: Record<string, unknown> | StudentUpdate,
): Promise<Student> {
  const supabase = clientFor(tenantId);
  const patch = { ...input, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch as never)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Student;
}

export async function deleteStudent(
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

export async function deactivateStudent(
  id: string,
  tenantId: string,
  deactivatedBy: string,
  reason?: string,
  category?: string,
): Promise<Student> {
  return updateStudent(id, tenantId, {
    status: "inactive",
    deactivated_at: new Date().toISOString(),
    deactivated_by: deactivatedBy,
    exit_reason: reason ?? null,
    exit_category: category ?? null,
  });
}

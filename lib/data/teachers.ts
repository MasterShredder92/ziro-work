import { getServiceClient } from "@/lib/supabase";
import { clientFor } from "./_client";
import type {
  TeacherInsert,
  TeacherUpdate,
} from "@/lib/types/entities";

export interface Teacher {
  id: string;
  tenant_id?: string;
  [key: string]: unknown;
}

export interface TeacherAvailability {
  id?: string;
  teacher_id?: string;
  tenant_id?: string;
  [key: string]: unknown;
}

export type DataResult<T> = Promise<{ data: T | null; error: string | null }>;

async function safeQuery<T>(
  fn: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (err) {
    console.error(err);
    return { data: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function getTeachersForTenant(tenantId: string): DataResult<Teacher[]> {
  return safeQuery(async () => {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .eq("tenant_id", tenantId);

    if (error) throw error;
    return (data || []) as Teacher[];
  });
}

export type ListTeachersFilter = {
  location_id?: string;
  is_active?: boolean;
  status?: string;
};

export type ListTeachersOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
};

export async function getTeachersByIds(
  tenantId: string,
  ids: string[],
): Promise<Teacher[]> {
  if (ids.length === 0) return [];
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as Teacher[];
}

export async function listTeachers(
  tenantId: string,
  filter?: ListTeachersFilter,
  opts?: ListTeachersOptions,
): Promise<Teacher[]> {
  const supabase = getServiceClient();
  let query = supabase
    .from("teachers")
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.status) query = query.eq("status", filter.status);
  if (typeof filter?.is_active === "boolean")
    query = query.eq("is_active", filter.is_active);

  if (filter?.location_id) {
    const svcClient = getServiceClient();
    const { data: teacherLinks, error: linkErr } = await svcClient
      .from("teacher_locations")
      .select("teacher_id")
      .eq("location_id", filter.location_id);
    if (linkErr) throw linkErr;
    const ids = Array.from(
      new Set(
        (teacherLinks ?? [])
          .map((r: { teacher_id?: string }) => r.teacher_id)
          .filter((v): v is string => typeof v === "string" && v.length > 0),
      ),
    );
    if (ids.length === 0) return [];
    query = query.in("id", ids);
  }

  query = query.order(opts?.orderBy ?? "created_at", {
    ascending: opts?.ascending ?? false,
  });

  const limit = opts?.limit ?? 500;
  if (typeof opts?.offset === "number") {
    query = query.range(opts.offset, opts.offset + limit - 1);
  } else {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Teacher[];
}

export async function getTeacherById(id: string): DataResult<Teacher | null> {
  return safeQuery(async () => {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as Teacher | null;
  });
}

export async function createTeacher(
  tenantId: string,
  input: Omit<TeacherInsert, "tenant_id">,
): Promise<Teacher> {
  const supabase = clientFor(tenantId);
  const payload: TeacherInsert = {
    ...input,
    tenant_id: tenantId,
    instruments: input.instruments ?? [],
  };
  const { data, error } = await supabase
    .from("teachers")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  return data as Teacher;
}

export async function updateTeacher(
  id: string,
  tenantId: string,
  input: TeacherUpdate,
): Promise<Teacher> {
  const supabase = clientFor(tenantId);
  const patch = { ...input, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from("teachers")
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Teacher;
}

export async function deleteTeacher(
  id: string,
  tenantId: string,
): Promise<void> {
  const supabase = clientFor(tenantId);
  const { error } = await supabase
    .from("teachers")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}

export async function getTeacherAvailability(
  teacherId: string
): DataResult<TeacherAvailability[]> {
  return safeQuery(async () => {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("teacher_availability")
      .select("*")
      .eq("teacher_id", teacherId);

    if (error) throw error;
    return (data || []) as TeacherAvailability[];
  });
}

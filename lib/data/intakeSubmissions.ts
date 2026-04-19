import type {
  IntakeSubmission,
  IntakeSubmissionInsert,
  IntakeSubmissionUpdate,
} from "@/lib/types/entities";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

const TABLE = "intake_submissions";

export type IntakeSubmissionFilter = {
  source?: string;
  location_id?: string;
  converted_student_id?: string | null;
};

export async function listIntakeSubmissions(
  tenantId: string,
  filter?: IntakeSubmissionFilter,
  opts?: ListOptions,
): Promise<IntakeSubmission[]> {
  const supabase = clientFor(tenantId);
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.source) query = query.eq("source", filter.source);
  if (filter?.location_id) query = query.eq("location_id", filter.location_id);
  if (filter?.converted_student_id === null)
    query = query.is("converted_student_id", null);
  else if (filter?.converted_student_id)
    query = query.eq("converted_student_id", filter.converted_student_id);

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "created_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 100,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as IntakeSubmission[];
}

export async function getIntakeSubmissionById(
  id: string,
  tenantId: string,
): Promise<IntakeSubmission | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as IntakeSubmission | null;
}

export async function createIntakeSubmission(
  tenantId: string,
  input: Omit<IntakeSubmissionInsert, "tenant_id">,
): Promise<IntakeSubmission> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, tenant_id: tenantId })
    .select("*")
    .single();
  if (error) throw error;
  return data as IntakeSubmission;
}

export async function updateIntakeSubmission(
  id: string,
  tenantId: string,
  input: IntakeSubmissionUpdate,
): Promise<IntakeSubmission> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .update(input)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as IntakeSubmission;
}

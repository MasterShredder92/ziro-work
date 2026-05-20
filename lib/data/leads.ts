import type {
  Lead,
  LeadInsert,
  LeadUpdate,
} from "@/lib/types/entities";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

const TABLE = "leads";

export type LeadFilter = {
  stage?: string;
  assigned_to?: string;
  location_id?: string;
  source?: string;
  intake_submission_id?: string;
  converted_student_id?: string | null;
};

export async function listLeads(
  tenantId: string,
  filter?: LeadFilter,
  opts?: ListOptions,
): Promise<Lead[]> {
  const supabase = await clientFor(tenantId);
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.stage) query = query.eq("stage", filter.stage);
  if (filter?.assigned_to) query = query.eq("assigned_to", filter.assigned_to);
  if (filter?.location_id) query = query.eq("location_id", filter.location_id);
  if (filter?.source) query = query.eq("source", filter.source);
  if (filter?.intake_submission_id)
    query = query.eq("intake_submission_id", filter.intake_submission_id);
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
  return (data ?? []) as Lead[];
}

export async function getLeadById(
  id: string,
  tenantId: string,
): Promise<Lead | null> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Lead | null;
}

export async function createLead(
  tenantId: string,
  input: Omit<LeadInsert, "tenant_id">,
): Promise<Lead> {
  const supabase = await clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, tenant_id: tenantId })
    .select("*")
    .single();
  if (error) throw error;
  return data as Lead;
}

export async function updateLead(
  id: string,
  tenantId: string,
  input: LeadUpdate,
): Promise<Lead> {
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
  return data as Lead;
}

export async function deleteLead(id: string, tenantId: string): Promise<void> {
  const supabase = await clientFor(tenantId);
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("tenant_id", tenantId)
    .eq("id", id);
  if (error) throw error;
}

export async function convertLeadToStudent(
  leadId: string,
  studentId: string,
  tenantId: string,
): Promise<Lead> {
  return updateLead(leadId, tenantId, {
    converted_student_id: studentId,
    stage: "enrolled",
  } as LeadUpdate);
}

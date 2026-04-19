import type {
  Family as FamilyRow,
  FamilyInsert,
  FamilyUpdate,
} from "@/lib/types/entities";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

const TABLE = "families";

export type FamilyFilter = {
  primary_location_id?: string;
  /** When set, only these family ids (e.g. from students at a studio). */
  family_ids?: string[];
  billing_status?: string;
  autopay_enabled?: boolean;
  profile_id?: string;
  referred_by_family_id?: string;
  search?: string;
};

function escapeIlikeTerm(term: string) {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function getFamiliesForTenant(tenantId: string): Promise<FamilyRow[]> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId);
  if (error) throw error;
  return (data ?? []) as FamilyRow[];
}

export async function getFamilyById(
  id: string,
  tenantId?: string,
): Promise<FamilyRow | null> {
  const supabase = clientFor(tenantId ?? "");
  let q = supabase.from(TABLE).select("*").eq("id", id);
  if (tenantId) q = q.eq("tenant_id", tenantId);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return (data ?? null) as FamilyRow | null;
}

/** Count active student rows per family (for CRM list columns). */
export async function countStudentsByFamilyIds(
  tenantId: string,
  familyIds: string[],
): Promise<Record<string, number>> {
  if (familyIds.length === 0) return {};
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from("students")
    .select("family_id")
    .eq("tenant_id", tenantId)
    .in("family_id", familyIds);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const id of familyIds) counts[id] = 0;
  for (const row of data ?? []) {
    const fid = (row as { family_id?: string }).family_id;
    if (fid && counts[fid] !== undefined) counts[fid] += 1;
  }
  return counts;
}

export async function listFamilies(
  tenantId: string,
  filter?: FamilyFilter,
  opts?: ListOptions,
): Promise<FamilyRow[]> {
  const supabase = clientFor(tenantId);
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.family_ids && filter.family_ids.length > 0) {
    query = query.in("id", filter.family_ids);
  }
  if (filter?.primary_location_id)
    query = query.eq("primary_location_id", filter.primary_location_id);
  if (filter?.billing_status)
    query = query.eq("billing_status", filter.billing_status);
  if (typeof filter?.autopay_enabled === "boolean")
    query = query.eq("autopay_enabled", filter.autopay_enabled);
  if (filter?.profile_id) query = query.eq("profile_id", filter.profile_id);
  if (filter?.referred_by_family_id)
    query = query.eq("referred_by_family_id", filter.referred_by_family_id);
  if (filter?.search && filter.search.trim().length > 0) {
    const t = escapeIlikeTerm(filter.search.trim());
    query = query.or(
      [
        `name.ilike.%${t}%`,
        `primary_email.ilike.%${t}%`,
        `primary_phone.ilike.%${t}%`,
        `primary_contact_name.ilike.%${t}%`,
        `parent_name.ilike.%${t}%`,
      ].join(","),
    );
  }

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "created_at",
    ascending: opts?.ascending ?? false,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as FamilyRow[];
}

export async function createFamily(
  tenantId: string,
  input: Omit<FamilyInsert, "tenant_id">,
): Promise<FamilyRow> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...input, tenant_id: tenantId })
    .select("*")
    .single();
  if (error) throw error;
  return data as FamilyRow;
}

export async function deleteFamily(
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

export async function updateFamily(
  id: string,
  tenantId: string,
  input: FamilyUpdate,
): Promise<FamilyRow> {
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
  return data as FamilyRow;
}

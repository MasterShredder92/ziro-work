import type { Database } from "@/lib/types/entities";
import { clientFor, applyListOptions, type ListOptions } from "./_client";

type ProfilesTable = Database["public"]["Tables"]["profiles"];
export type Profile = ProfilesTable["Row"];
export type ProfileInsert = ProfilesTable["Insert"];
export type ProfileUpdate = ProfilesTable["Update"];

const TABLE = "profiles";

export type ProfileFilter = {
  role?: string;
  is_active?: boolean;
  search?: string;
  ids?: string[];
};

export async function listProfiles(
  tenantId: string,
  filter?: ProfileFilter,
  opts?: ListOptions,
): Promise<Profile[]> {
  const supabase = clientFor(tenantId);
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId);

  if (filter?.role) query = query.eq("role", filter.role);
  if (typeof filter?.is_active === "boolean")
    query = query.eq("is_active", filter.is_active);
  if (filter?.ids && filter.ids.length > 0)
    query = query.in("id", filter.ids);
  if (filter?.search && filter.search.trim().length > 0) {
    const s = filter.search.trim();
    query = query.or(
      [
        `first_name.ilike.%${s}%`,
        `last_name.ilike.%${s}%`,
        `email.ilike.%${s}%`,
      ].join(","),
    );
  }

  const ordered = applyListOptions(query, {
    orderBy: opts?.orderBy ?? "first_name",
    ascending: opts?.ascending ?? true,
    limit: opts?.limit ?? 200,
    offset: opts?.offset,
  });

  const { data, error } = await ordered;
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function getProfileById(
  id: string,
  tenantId: string,
): Promise<Profile | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Profile | null;
}

export async function getProfilesByIds(
  ids: string[],
  tenantId: string,
): Promise<Profile[]> {
  if (!ids || ids.length === 0) return [];
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

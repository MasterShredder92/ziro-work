/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServiceClient } from "@/lib/supabase";

export interface TenantRow {
  id: string;
  name: string | null;
  slug: string | null;
  plan: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface UpsertTenantInput {
  id: string;
  name?: string;
  slug?: string;
  plan?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * Fetch a single tenant by ID.
 */
export async function getTenant(tenantId: string): Promise<TenantRow | null> {
  const db = getServiceClient();
  const { data, error } = await (db as any)
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as TenantRow | null;
}

/**
 * List all tenants.
 */
export async function listTenants(): Promise<TenantRow[]> {
  const db = getServiceClient();
  const { data, error } = await (db as any)
    .from("tenants")
    .select("*")
    .order("name", { ascending: true })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as TenantRow[];
}

/**
 * Upsert a tenant record.
 */
export async function upsertTenant(input: UpsertTenantInput): Promise<TenantRow> {
  const db = getServiceClient();
  const { data, error } = await (db as any)
    .from("tenants")
    .upsert(
      { ...input, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as TenantRow;
}

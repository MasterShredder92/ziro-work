/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServiceClient } from "@/lib/supabase";

export interface TenantRow {
  id: string;
  name: string | null;
  slug: string | null;
  plan: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

/** Only columns that actually exist in the tenants table. */
export interface UpsertTenantInput {
  id: string;
  name?: string;
  slug?: string;
  logo_url?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  timezone?: string | null;
  plan?: string | null;
  billing_email?: string | null;
  pricing_tier?: string | null;
  trial_ends_at?: string | null;
  location_count_billed?: number | null;
  onboarding_emails_sent?: Record<string, unknown> | null;
  onboarding_progress?: Record<string, unknown> | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_connect_account_id?: string | null;
  stripe_connect_status?: string | null;
}

const TENANT_COLUMNS: (keyof UpsertTenantInput)[] = [
  "id",
  "name",
  "slug",
  "logo_url",
  "primary_color",
  "accent_color",
  "timezone",
  "plan",
  "billing_email",
  "pricing_tier",
  "trial_ends_at",
  "location_count_billed",
  "onboarding_emails_sent",
  "onboarding_progress",
  "stripe_customer_id",
  "stripe_subscription_id",
  "stripe_connect_account_id",
  "stripe_connect_status",
];

function stripUnknownColumns(input: UpsertTenantInput): Partial<UpsertTenantInput> & { id: string } {
  const safe: Record<string, unknown> = { id: input.id };
  for (const col of TENANT_COLUMNS) {
    if (col !== "id" && input[col] !== undefined) {
      safe[col] = input[col];
    }
  }
  return safe as Partial<UpsertTenantInput> & { id: string };
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
 * Upsert a tenant record — only sends columns that exist in the tenants table.
 */
export async function upsertTenant(input: UpsertTenantInput): Promise<TenantRow> {
  const db = getServiceClient();
  const safe = stripUnknownColumns(input);
  const { data, error } = await (db as any)
    .from("tenants")
    .upsert(
      { ...safe, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as TenantRow;
}

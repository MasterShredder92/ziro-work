import { clientFor } from "./_client";

const TABLE = "billing_settings";

export type BillingSettingsRow = {
  tenant_id: string;
  created_at: string;
  updated_at: string;
  invoice_prefix: string;
  invoice_next_number: number;
  invoice_pad_width: number;
  default_terms: string | null;
  default_net_days: number;
  default_tax_rate_bp: number;
  default_currency: string;
  payment_methods: string[];
  late_fee_cents: number;
  late_fee_grace_days: number;
  metadata: Record<string, unknown> | null;
};

export type BillingSettingsUpdate = Partial<
  Omit<BillingSettingsRow, "tenant_id" | "created_at">
>;

export async function getBillingSettings(
  tenantId: string,
): Promise<BillingSettingsRow | null> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as BillingSettingsRow | null;
}

export async function upsertBillingSettings(
  tenantId: string,
  patch: BillingSettingsUpdate,
): Promise<BillingSettingsRow> {
  const supabase = clientFor(tenantId);
  const body = {
    tenant_id: tenantId,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(body, { onConflict: "tenant_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as BillingSettingsRow;
}

export async function incrementInvoiceSequence(
  tenantId: string,
): Promise<BillingSettingsRow> {
  const current = await getBillingSettings(tenantId);
  const next = (current?.invoice_next_number ?? 1001) + 1;
  return upsertBillingSettings(tenantId, {
    invoice_next_number: next,
  });
}

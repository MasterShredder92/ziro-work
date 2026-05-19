import "server-only";
import { getServiceClient } from "@/lib/supabase";
import type { BillingAgingBucket, BillingAgingBucketId } from "./types";
import type { FamilyBalance } from "./models";

const AGING_BUCKET_META: Record<
  BillingAgingBucketId,
  { label: string; minDays: number; maxDays: number | null }
> = {
  current: { label: "Current",      minDays: 0,  maxDays: 0    },
  "0-30":  { label: "1 – 30 days",  minDays: 1,  maxDays: 30   },
  "31-60": { label: "31 – 60 days", minDays: 31, maxDays: 60   },
  "61-90": { label: "61 – 90 days", minDays: 61, maxDays: 90   },
  "90+":   { label: "90+ days",     minDays: 91, maxDays: null  },
};

export async function computeFamilyBalance(
  tenantId: string,
  familyId: string,
): Promise<FamilyBalance> {
  const supabase = getServiceClient();
  const { data: row, error } = await supabase
    .from("view_family_account_summary")
    .select("outstanding_cents, paid_cents, credit_balance_cents, open_invoice_count, overdue_invoice_count")
    .eq("tenant_id", tenantId)
    .eq("family_id", familyId)
    .maybeSingle();

  if (error) throw error;
  if (!row) {
    return { familyId, tenantId, outstandingCents: 0, paidCents: 0, creditBalanceCents: 0, openInvoices: 0, overdueInvoices: 0 };
  }

  return {
    familyId,
    tenantId,
    outstandingCents:    (row.outstanding_cents    as number) ?? 0,
    paidCents:           (row.paid_cents           as number) ?? 0,
    creditBalanceCents:  (row.credit_balance_cents as number) ?? 0,
    openInvoices:        (row.open_invoice_count   as number) ?? 0,
    overdueInvoices:     (row.overdue_invoice_count as number) ?? 0,
  };
}

export async function computeTenantAging(tenantId: string): Promise<BillingAgingBucket[]> {
  const supabase = getServiceClient();
  const { data: rows, error } = await supabase
    .from("view_tenant_billing_aging")
    .select("bucket_id, invoice_count, outstanding_cents")
    .eq("tenant_id", tenantId);

  if (error) throw error;

  const byBucket = new Map(
    (rows ?? []).map((r) => [r.bucket_id as BillingAgingBucketId, r]),
  );

  return (Object.keys(AGING_BUCKET_META) as BillingAgingBucketId[]).map((id) => {
    const meta = AGING_BUCKET_META[id];
    const row = byBucket.get(id);
    return {
      id,
      label:           meta.label,
      minDays:         meta.minDays,
      maxDays:         meta.maxDays,
      invoiceCount:    (row?.invoice_count    as number) ?? 0,
      outstandingCents: (row?.outstanding_cents as number) ?? 0,
    };
  });
}

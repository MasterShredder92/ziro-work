import { getCRMTenantId } from "../crm/_tenant";
import { getServiceClient } from "@/lib/supabase";
import { InvoicesClient } from "./_client";

export const dynamic = "force-dynamic";

const LOCATIONS = [
  { id: "f7b52dd5-12ee-437f-9c60-f8adf454ac31", name: "Bellevue", color: "#7C3AED" },
  { id: "40c67ffc-91b5-46a9-94bd-6ddffdfb7638", name: "Gretna", color: "#16A34A" },
  { id: "cebd97d4-c241-4de2-8ade-49e5cc0070d5", name: "Elkhorn", color: "#0EA5E9" },
  { id: "d48229c1-b70a-4d29-893e-5079887dab76", name: "Omaha", color: "#DC2626" },
];

export type BillingMetrics = {
  locationId: string | null;
  locationName: string;
  color: string;
  collectedThisMonth: number;
  totalInvoicedThisMonth: number;
  discountedThisMonth: number;
  nextMonthProjected: number;
  scheduledPayments: number;
};

function sumCents(rows: { amount_cents?: number | null }[]) {
  return rows.reduce((s, r) => s + (r.amount_cents ?? 0), 0);
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
    location_id?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const tenantId = await getCRMTenantId();
  const db = getServiceClient();
  const params = (await searchParams) ?? {};
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = 100;
  const offset = (page - 1) * pageSize;

  // Date helpers
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split("T")[0];
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split("T")[0];

  // ── Filtered invoice list ──────────────────────────────────────────────────
  let query = db
    .from("square_invoices")
    .select(
      "id,family_id,status,amount_cents,invoice_number,due_date,paid_at,square_created_at,location_id,customer_email,customer_name,requested_amount,amount_paid,invoice_date,recurring_series_id",
      { count: "exact" }
    )
    .eq("tenant_id", tenantId)
    .order("invoice_date", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (params.status && params.status !== "all") query = query.eq("status", params.status.toUpperCase());
  if (params.location_id) query = query.eq("location_id", params.location_id);
  if (params.search?.trim()) {
    const q = params.search.trim();
    query = query.or(`customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,invoice_number.ilike.%${q}%`);
  }

  const { data: invoices, count } = await query;

  // ── Billing metrics (all locations) ──────────────────────────────────────
  const [collectedRes, invoicedRes, scheduledRes, nextMonthRes, overdueRes] = await Promise.all([
    // Collected this month (PAID, paid_at in this month)
    db.from("square_invoices").select("amount_cents,location_id").eq("tenant_id", tenantId).eq("status", "PAID").gte("paid_at", thisMonthStart).lte("paid_at", thisMonthEnd + "T23:59:59"),
    // Total invoiced this month (invoice_date in this month)
    db.from("square_invoices").select("amount_cents,requested_amount,location_id").eq("tenant_id", tenantId).gte("invoice_date", thisMonthStart).lte("invoice_date", thisMonthEnd),
    // Scheduled payments (SCHEDULED status)
    db.from("square_invoices").select("amount_cents,location_id").eq("tenant_id", tenantId).eq("status", "SCHEDULED"),
    // Next month projected (invoice_date in next month)
    db.from("square_invoices").select("amount_cents,location_id").eq("tenant_id", tenantId).gte("invoice_date", nextMonthStart).lte("invoice_date", nextMonthEnd),
    // Overdue count
    db.from("square_invoices").select("amount_cents", { count: "exact" }).eq("tenant_id", tenantId).eq("status", "UNPAID").lt("due_date", now.toISOString().split("T")[0]),
  ]);

  const collected = collectedRes.data ?? [];
  const invoiced = invoicedRes.data ?? [];
  const scheduled = scheduledRes.data ?? [];
  const nextMonth = nextMonthRes.data ?? [];

  // Build per-location metrics
  function metricsForLocation(locId: string | null): BillingMetrics {
    const filter = <T extends { location_id?: string | null }>(arr: T[]) =>
      locId === null ? arr : arr.filter((r) => r.location_id === locId);

    const inv = filter(invoiced);
    const totalInvoiced = sumCents(inv);
    // Discounted = sum of (requested_amount - amount_cents) where requested_amount > amount_cents
    const discounted = inv.reduce((s, r) => {
      const req = (r as { requested_amount?: number | null }).requested_amount ?? r.amount_cents ?? 0;
      const actual = r.amount_cents ?? 0;
      return s + Math.max(0, req - actual);
    }, 0);

    const loc = LOCATIONS.find((l) => l.id === locId);
    return {
      locationId: locId,
      locationName: loc?.name ?? "All Schools",
      color: loc?.color ?? "#00ff88",
      collectedThisMonth: sumCents(filter(collected)),
      totalInvoicedThisMonth: totalInvoiced,
      discountedThisMonth: discounted,
      nextMonthProjected: sumCents(filter(nextMonth)),
      scheduledPayments: sumCents(filter(scheduled)),
    };
  }

  const billingMetrics: BillingMetrics[] = [
    metricsForLocation(null), // All Schools
    ...LOCATIONS.map((l) => metricsForLocation(l.id)),
  ];

  const paidTotal = sumCents(collected);
  const unpaidRes = await db.from("square_invoices").select("amount_cents").eq("tenant_id", tenantId).eq("status", "UNPAID");
  const unpaidTotal = sumCents(unpaidRes.data ?? []);

  return (
    <InvoicesClient
      invoices={invoices ?? []}
      totalCount={count ?? 0}
      page={page}
      pageSize={pageSize}
      paidTotal={paidTotal}
      unpaidTotal={unpaidTotal}
      overdueCount={overdueRes.count ?? 0}
      initialStatus={params.status ?? "all"}
      initialLocationId={params.location_id ?? ""}
      initialSearch={params.search ?? ""}
      billingMetrics={billingMetrics}
    />
  );
}

import { getCRMTenantId } from "../crm/_tenant";
import { getServiceClient } from "@/lib/supabase";
import { InvoicesClient } from "./_client";

export const dynamic = "force-dynamic";

// Square location ID → display info
const SQ_LOCATION_MAP: Record<string, { id: string; name: string; color: string }> = {};

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

function sumField(rows: Record<string, unknown>[], field: string) {
  return rows.reduce((s, r) => s + ((r[field] as number) ?? 0), 0);
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    status?: string;
    location_id?: string;
    search?: string;
    page?: string;
    month_offset?: string;
  }>;
}) {
  const tenantId = await getCRMTenantId();
  const db = getServiceClient();
  const params = (await searchParams) ?? {};
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const pageSize = 100;
  const offset = (page - 1) * pageSize;

  // Month-block navigation: offset from current month (0 = current, -1 = prev, +1 = next, +2 = month after next)
  const now = new Date();
  const monthOffset = parseInt(params.month_offset ?? "0", 10);
  const targetYear = now.getFullYear();
  const targetMonth = now.getMonth() + monthOffset; // JS handles overflow correctly
  const viewStart = new Date(targetYear, targetMonth, 1).toISOString().split("T")[0];
  const viewEnd = new Date(targetYear, targetMonth + 1, 0).toISOString().split("T")[0];

  // For billing metrics bar — always current + next month
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split("T")[0];
  const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split("T")[0];

  // Month label for display
  const viewLabel = new Date(targetYear, targetMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = now.toISOString().split("T")[0];

  // ── Filtered invoice list ──────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (db as any)
    .from("square_invoices_fact")
    .select(
      "id,family_id,status,amount_cents,invoice_number,due_date,paid_at,square_created_at,square_location_id,customer_email,customer_name,requested_amount,amount_paid_cents,invoice_date,recurring_series_id",
      { count: "exact" }
    )
    .eq("tenant_id", tenantId)
    .gte("due_date", viewStart)
    .lte("due_date", viewEnd)
    .order("due_date", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (params.status && params.status !== "all") query = query.eq("status", params.status.toUpperCase());
  if (params.location_id) query = query.eq("square_location_id", params.location_id);
  if (params.search?.trim()) {
    const q = params.search.trim();
    query = query.or(`customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,invoice_number.ilike.%${q}%`);
  }

  const { data: invoices, count } = await query;

  // ── Billing metrics — fetch all invoices for current + next month ──────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allMetricRows } = await (db as any)
    .from("square_invoices_fact")
    .select("status,amount_cents,requested_amount,amount_paid_cents,due_date,paid_at,square_location_id")
    .eq("tenant_id", tenantId)
    .gte("due_date", thisMonthStart)
    .lte("due_date", nextMonthEnd)
    .limit(10000);

  const metricRows: Record<string, unknown>[] = allMetricRows ?? [];

  // Build square_location_id → location info from the locations table directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: locRows } = await (db as any)
    .from("locations")
    .select("id,name,color,square_location_id")
    .eq("tenant_id", tenantId);

  const sqToLocation: Record<string, { id: string; name: string; color: string }> = {};
  for (const loc of (locRows ?? []) as { id: string; name: string; color: string; square_location_id: string | null }[]) {
    if (loc.square_location_id) {
      sqToLocation[loc.square_location_id] = { id: loc.id, name: loc.name, color: loc.color };
    }
  }

  // Build per-location metrics
  function metricsForSqLocation(sqLocId: string | null): BillingMetrics {
    const rows = sqLocId === null
      ? metricRows
      : metricRows.filter((r) => r.square_location_id === sqLocId);

    const mtdRows = rows.filter((r) => {
      const d = r.due_date as string | null;
      return d && d >= thisMonthStart && d <= thisMonthEnd;
    });

    const collectedThisMonth = rows
      .filter((r) => {
        const d = r.due_date as string | null;
        const status = r.status as string | null;
        if (status === "PAID" && d && d >= thisMonthStart && d <= thisMonthEnd) return true;
        const paidAt = r.paid_at as string | null;
        if (paidAt && paidAt.slice(0, 10) >= thisMonthStart && paidAt.slice(0, 10) <= thisMonthEnd) return true;
        return false;
      })
      .reduce((s, r) => s + ((r.amount_paid_cents as number) ?? (r.amount_cents as number) ?? 0), 0);

    const totalInvoicedThisMonth = mtdRows.reduce(
      (s, r) => s + ((r.requested_amount as number) ?? (r.amount_cents as number) ?? 0),
      0
    );
    const actualCharged = mtdRows.reduce((s, r) => s + ((r.amount_cents as number) ?? 0), 0);
    const discountedThisMonth = Math.max(0, totalInvoicedThisMonth - actualCharged);

    const scheduledPayments = rows
      .filter((r) => r.status === "SCHEDULED" || r.status === "UNPAID")
      .reduce((s, r) => s + ((r.amount_cents as number) ?? 0), 0);

    const nextMonthProjected = rows
      .filter((r) => {
        const d = r.due_date as string | null;
        return d && d >= nextMonthStart && d <= nextMonthEnd;
      })
      .reduce((s, r) => s + ((r.requested_amount as number) ?? (r.amount_cents as number) ?? 0), 0);

    const loc = sqLocId ? sqToLocation[sqLocId] : null;
    return {
      locationId: sqLocId,
      locationName: loc?.name ?? "All Schools",
      color: loc?.color ?? "#00ff88",
      collectedThisMonth,
      totalInvoicedThisMonth,
      discountedThisMonth,
      nextMonthProjected,
      scheduledPayments,
    };
  }

  // Get unique sq location IDs that we know about
  const knownSqIds = [...new Set(metricRows.map((r) => r.square_location_id as string).filter(Boolean))]
    .filter((sqId) => sqToLocation[sqId]);

  const ORDER = ["Bellevue", "Gretna", "Elkhorn", "Omaha"];
  knownSqIds.sort((a, b) => ORDER.indexOf(sqToLocation[a]?.name) - ORDER.indexOf(sqToLocation[b]?.name));

  const billingMetrics: BillingMetrics[] = [
    metricsForSqLocation(null), // All Schools
    ...knownSqIds.map((sqId) => metricsForSqLocation(sqId)),
  ];

  // ── Overdue count ──────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: overdueCount } = await (db as any)
    .from("square_invoices_fact")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "UNPAID")
    .lt("due_date", today);

  const paidTotal = sumField(
    metricRows.filter((r) => {
      const d = r.due_date as string | null;
      return r.status === "PAID" && d && d >= thisMonthStart && d <= thisMonthEnd;
    }),
    "amount_paid_cents"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: unpaidRows } = await (db as any)
    .from("square_invoices_fact")
    .select("amount_cents")
    .eq("tenant_id", tenantId)
    .eq("status", "UNPAID");
  const unpaidTotal = sumField(unpaidRows ?? [], "amount_cents");

  // Map invoices to the shape InvoicesClient expects (location_id = sq id for now)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedInvoices = (invoices ?? []).map((inv: any) => ({
    ...inv,
    location_id: inv.square_location_id ?? null,
    amount_paid: inv.amount_paid_cents ?? null,
  }));

  return (
    <InvoicesClient
      invoices={mappedInvoices}
      totalCount={count ?? 0}
      page={page}
      pageSize={pageSize}
      paidTotal={paidTotal}
      unpaidTotal={unpaidTotal}
      overdueCount={overdueCount ?? 0}
      initialStatus={params.status ?? "all"}
      initialLocationId={params.location_id ?? ""}
      initialSearch={params.search ?? ""}
      initialMonthOffset={monthOffset}
      viewLabel={viewLabel}
      billingMetrics={billingMetrics}
    />
  );
}

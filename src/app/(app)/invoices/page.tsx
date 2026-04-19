import { getCRMTenantId } from "../crm/_tenant";
import { getServiceClient } from "@/lib/supabase";
import { InvoicesClient } from "./_client";

export const dynamic = "force-dynamic";

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

  let query = db
    .from("square_invoices")
    .select(
      "id,family_id,status,amount_cents,invoice_number,due_date,paid_at,square_created_at,location_id,customer_email,customer_name,requested_amount,amount_paid,invoice_date,recurring_series_id",
      { count: "exact" }
    )
    .eq("tenant_id", tenantId)
    .order("invoice_date", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status.toUpperCase());
  }

  if (params.location_id) {
    query = query.eq("location_id", params.location_id);
  }

  if (params.search?.trim()) {
    const q = params.search.trim();
    query = query.or(
      `customer_name.ilike.%${q}%,customer_email.ilike.%${q}%,invoice_number.ilike.%${q}%`
    );
  }

  const { data: invoices, count, error } = await query;

  // Fetch summary stats (all-time, not filtered)
  const [paidRes, unpaidRes, overdueRes] = await Promise.all([
    db
      .from("square_invoices")
      .select("amount_cents", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("status", "PAID"),
    db
      .from("square_invoices")
      .select("amount_cents", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("status", "UNPAID"),
    db
      .from("square_invoices")
      .select("amount_cents", { count: "exact" })
      .eq("tenant_id", tenantId)
      .eq("status", "UNPAID")
      .lt("due_date", new Date().toISOString().split("T")[0]),
  ]);

  const paidTotal = (paidRes.data ?? []).reduce(
    (sum, r) => sum + (r.amount_cents ?? 0),
    0
  );
  const unpaidTotal = (unpaidRes.data ?? []).reduce(
    (sum, r) => sum + (r.amount_cents ?? 0),
    0
  );

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
    />
  );
}


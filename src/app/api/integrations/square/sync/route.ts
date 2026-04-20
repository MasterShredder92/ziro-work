/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/**
 * Manual Square sync — pulls invoices, payments, and customers from Square API
 * and upserts into Supabase. Also links invoices to families/students via square_customer_id.
 *
 * POST /api/integrations/square/sync
 *
 * What this fixes:
 * 1. Invoices are linked to families by matching square_customer_id on the families table
 * 2. Payments are synced into square_payments_fact
 * 3. Customer records update square_customer_id on families and students
 * 4. Full payment history is available per family/student
 */

function normalizeStatus(squareStatus: string | undefined): string {
  switch ((squareStatus ?? "").toUpperCase()) {
    case "PAID": return "PAID";
    case "PARTIALLY_PAID": return "PARTIALLY_PAID";
    case "PAYMENT_PENDING": return "UNPAID";
    case "UNPAID": return "UNPAID";
    case "SCHEDULED": return "SCHEDULED";
    case "DRAFT": return "DRAFT";
    case "CANCELED":
    case "CANCELLED": return "CANCELLED";
    default: return squareStatus ?? "UNKNOWN";
  }
}

function toCents(money: { amount?: number | null } | null | undefined): number | null {
  if (!money || money.amount == null) return null;
  return money.amount; // Square already stores in cents
}

function toDate(dt: string | null | undefined): string | null {
  if (!dt) return null;
  return dt.split("T")[0];
}

async function squareFetch(path: string, accessToken: string): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch(`https://connect.squareup.com${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2024-01-17",
      "Content-Type": "application/json",
    },
  });
  let body: any;
  try { body = await res.json(); } catch { body = {}; }
  return { ok: res.ok, status: res.status, body };
}

export async function POST(req: NextRequest) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Square access token not configured. Add SQUARE_ACCESS_TOKEN to environment variables." },
      { status: 503 }
    );
  }

  // Optional: pass { "since": "2024-01-01" } in body for incremental sync
  // If not provided, syncs ALL history from the beginning of Square's records
  let sinceDate: string | null = null;
  try {
    const body = await req.json().catch(() => ({})) as { since?: string };
    if (body.since && /^\d{4}-\d{2}-\d{2}$/.test(body.since)) {
      sinceDate = body.since;
    }
  } catch { /* no body */ }

  const tenantId = DEFAULT_TENANT_ID;
  const db = getServiceClient();
  const errors: string[] = [];
  const stats = {
    locations: 0,
    invoicesFetched: 0,
    invoicesUpserted: 0,
    invoicesLinked: 0,
    paymentsFetched: 0,
    paymentsUpserted: 0,
    customersFetched: 0,
    customersLinked: 0,
  };

  try {
    // ── Step 1: Fetch all Square locations ──────────────────────────────────
    const locRes = await squareFetch("/v2/locations", accessToken);
    if (!locRes.ok) {
      return NextResponse.json(
        { error: `Square locations fetch failed (${locRes.status})`, details: locRes.body },
        { status: 502 }
      );
    }
    const locations: { id: string; name?: string }[] = locRes.body?.locations ?? [];
    if (locations.length === 0) {
      return NextResponse.json({ error: "No Square locations found for this account." }, { status: 404 });
    }
    stats.locations = locations.length;

    // ── Step 2: Build a lookup map of square_customer_id → family_id ────────
    // This is the KEY fix: invoices come in with a square_customer_id on the recipient.
    // We match that to families.square_customer_id to link invoices to families.
    const { data: familyRows } = await (db as any)
      .from("families")
      .select("id, square_customer_id")
      .eq("tenant_id", tenantId)
      .not("square_customer_id", "is", null);
    const customerToFamily: Record<string, string> = {};
    for (const f of (familyRows ?? [])) {
      if (f.square_customer_id) customerToFamily[f.square_customer_id] = f.id;
    }

    // Also build student lookup
    const { data: studentRows } = await (db as any)
      .from("students")
      .select("id, square_customer_id, family_id")
      .eq("tenant_id", tenantId)
      .not("square_customer_id", "is", null);
    const customerToStudent: Record<string, string> = {};
    const customerToStudentFamily: Record<string, string> = {};
    for (const s of (studentRows ?? [])) {
      if (s.square_customer_id) {
        customerToStudent[s.square_customer_id] = s.id;
        if (s.family_id) customerToStudentFamily[s.square_customer_id] = s.family_id;
      }
    }

    // ── Step 3: Fetch customers from Square and update family/student records ─
    // This ensures square_customer_id is populated on families and students
    let customerCursor: string | undefined;
    const squareCustomers: Record<string, any>[] = [];
    do {
      const params = new URLSearchParams({ limit: "100" });
      if (customerCursor) params.set("cursor", customerCursor);
      const custRes = await squareFetch(`/v2/customers?${params.toString()}`, accessToken);
      if (!custRes.ok) {
        errors.push(`Customers fetch failed: ${custRes.body?.errors?.[0]?.detail ?? custRes.status}`);
        break;
      }
      const batch: Record<string, any>[] = custRes.body?.customers ?? [];
      squareCustomers.push(...batch);
      customerCursor = custRes.body?.cursor as string | undefined;
    } while (customerCursor);
    stats.customersFetched = squareCustomers.length;

    // Match Square customers to families/students by email
    for (const cust of squareCustomers) {
      const squareCustId: string = cust.id;
      const email: string | null = cust.email_address ?? null;
      if (!email) continue;

      // Try to match to a family by email
      const { data: matchedFamilies } = await (db as any)
        .from("families")
        .select("id, square_customer_id")
        .eq("tenant_id", tenantId)
        .ilike("primary_email", email)
        .limit(1);

      if (matchedFamilies?.length > 0) {
        const fam = matchedFamilies[0];
        if (!fam.square_customer_id) {
          await (db as any)
            .from("families")
            .update({ square_customer_id: squareCustId, updated_at: new Date().toISOString() })
            .eq("id", fam.id)
            .eq("tenant_id", tenantId);
          customerToFamily[squareCustId] = fam.id;
          stats.customersLinked++;
        } else {
          customerToFamily[fam.square_customer_id] = fam.id;
        }
        continue;
      }

      // Try to match to a student by email
      const { data: matchedStudents } = await (db as any)
        .from("students")
        .select("id, family_id, square_customer_id")
        .eq("tenant_id", tenantId)
        .ilike("email", email)
        .limit(1);

      if (matchedStudents?.length > 0) {
        const stu = matchedStudents[0];
        if (!stu.square_customer_id) {
          await (db as any)
            .from("students")
            .update({ square_customer_id: squareCustId, updated_at: new Date().toISOString() })
            .eq("id", stu.id)
            .eq("tenant_id", tenantId);
          customerToStudent[squareCustId] = stu.id;
          if (stu.family_id) customerToStudentFamily[squareCustId] = stu.family_id;
          stats.customersLinked++;
          // Also update family lookup
          if (stu.family_id) customerToFamily[squareCustId] = stu.family_id;
        }
      }
    }

    // ── Step 4: Fetch invoices per location and upsert with family_id ────────
    for (const loc of locations) {
      let cursor: string | undefined;
      do {
        const params = new URLSearchParams({ location_id: loc.id, limit: "200" });
        if (cursor) params.set("cursor", cursor);

        const invRes = await squareFetch(`/v2/invoices?${params.toString()}`, accessToken);
        if (!invRes.ok) {
          errors.push(`Location ${loc.id}: ${invRes.body?.errors?.[0]?.detail ?? invRes.status}`);
          break;
        }

        const invoices: Record<string, any>[] = invRes.body?.invoices ?? [];
        cursor = invRes.body?.cursor as string | undefined;
        stats.invoicesFetched += invoices.length;
        if (invoices.length === 0) break;

        const rows = invoices.map((inv) => {
          const primaryRecipient: Record<string, any> = inv.primary_recipient ?? {};
          const paymentRequests: Record<string, any>[] = inv.payment_requests ?? [];
          const firstPayment = paymentRequests[0] ?? {};
          const computedAmountMoney = firstPayment.computed_amount_money ?? null;
          const totalCompletedAmountMoney = firstPayment.total_completed_amount_money ?? null;
          const dueDate = firstPayment.due_date ?? null;

          // Resolve family_id from square_customer_id
          const sqCustId: string | null = primaryRecipient.customer_id ?? null;
          const familyId: string | null = sqCustId
            ? (customerToFamily[sqCustId] ?? customerToStudentFamily[sqCustId] ?? null)
            : null;
          if (familyId) stats.invoicesLinked++;

          const row: Record<string, any> = {
            tenant_id: tenantId,
            square_invoice_id: inv.id as string,
            square_location_id: inv.location_id ?? loc.id,
            location_id: inv.location_id ?? loc.id,
            square_customer_id: sqCustId,
            family_id: familyId,
            invoice_number: inv.invoice_number ?? null,
            title: inv.title ?? null,
            status: normalizeStatus(inv.status),
            customer_name: [primaryRecipient.given_name, primaryRecipient.family_name]
              .filter(Boolean).join(" ") || null,
            customer_email: primaryRecipient.email_address ?? null,
            amount_cents: toCents(computedAmountMoney),
            requested_amount: toCents(computedAmountMoney),
            amount_paid: toCents(totalCompletedAmountMoney),
            due_date: dueDate,
            invoice_date: toDate(inv.created_at),
            square_created_at: inv.created_at ?? null,
            paid_at: null,
            raw_data: inv,
            synced_at: new Date().toISOString(),
          };

          // Set paid_at for PAID invoices
          if ((inv.status as string)?.toUpperCase() === "PAID") {
            for (const pr of paymentRequests) {
              if (pr.completed_at) { row.paid_at = toDate(pr.completed_at); break; }
            }
          }

          return row;
        });

        // Upsert in batches of 50
        for (let i = 0; i < rows.length; i += 50) {
          const batch = rows.slice(i, i + 50);
          const { error } = await (db as any)
            .from("square_invoices")
            .upsert(batch, { onConflict: "square_invoice_id" });
          if (error) { errors.push(error.message); }
          else { stats.invoicesUpserted += batch.length; }
        }
      } while (cursor);
    }

    // ── Step 5: Fetch payments per location and upsert into square_payments_fact ─
    // Uses begin_time to pull full history (or from sinceDate for incremental sync)
    // Square Payments API supports begin_time/end_time in RFC 3339 format
    for (const loc of locations) {
      let cursor: string | undefined;
      do {
        const params = new URLSearchParams({ location_id: loc.id, limit: "100", sort_order: "ASC" });
        // Pull from sinceDate if provided, otherwise pull all history
        if (sinceDate) {
          params.set("begin_time", `${sinceDate}T00:00:00Z`);
        }
        if (cursor) params.set("cursor", cursor);

        const payRes = await squareFetch(`/v2/payments?${params.toString()}`, accessToken);
        if (!payRes.ok) {
          errors.push(`Payments for location ${loc.id}: ${payRes.body?.errors?.[0]?.detail ?? payRes.status}`);
          break;
        }

        const payments: Record<string, any>[] = payRes.body?.payments ?? [];
        cursor = payRes.body?.cursor as string | undefined;
        stats.paymentsFetched += payments.length;
        if (payments.length === 0) break;

        const rows = payments.map((pay) => {
          const amtMoney = pay.amount_money ?? {};
          const totalMoney = pay.total_money ?? {};
          const netMoney = pay.net_amount_money ?? {};
          const refundedMoney = pay.refunded_money ?? {};
          const tipMoney = pay.tip_money ?? {};
          const appFeeMoney = pay.app_fee_money ?? {};
          const processingFees: Record<string, any>[] = pay.processing_fee ?? [];
          const processingFeeTotal = processingFees.reduce(
            (sum: number, fee: Record<string, any>) => sum + ((fee.amount_money?.amount as number) ?? 0),
            0
          );
          const reportingDate = toDate(pay.created_at) ?? new Date().toISOString().split("T")[0];
          const sourceType = pay.source_type ?? (pay.card_details ? "CARD" : pay.cash_details ? "CASH" : "OTHER");
          const tenderBucket = sourceType === "CARD" ? "card" : sourceType === "CASH" ? "cash" : "other";

          return {
            tenant_id: tenantId,
            square_payment_id: pay.id as string,
            square_location_id: pay.location_id ?? loc.id,
            location_id: pay.location_id ?? loc.id,
            status: pay.status ?? "UNKNOWN",
            reporting_date: reportingDate,
            amount_money_cents: amtMoney.amount ?? null,
            total_money_cents: totalMoney.amount ?? null,
            net_total_cents: netMoney.amount ?? null,
            refunded_money_cents: refundedMoney.amount ?? null,
            tip_money_cents: tipMoney.amount ?? null,
            application_fee_money_cents: appFeeMoney.amount ?? null,
            processing_fee_total_cents: processingFeeTotal,
            source_type: sourceType,
            tender_bucket: tenderBucket,
            created_at_square: pay.created_at ?? null,
            updated_at_square: pay.updated_at ?? null,
            raw_json: pay,
            synced_at: new Date().toISOString(),
          };
        });

        for (let i = 0; i < rows.length; i += 50) {
          const batch = rows.slice(i, i + 50);
          const { error } = await (db as any)
            .from("square_payments_fact")
            .upsert(batch, { onConflict: "square_payment_id" });
          if (error) { errors.push(`Payments upsert: ${error.message}`); }
          else { stats.paymentsUpserted += batch.length; }
        }

      } while (cursor);
    }

    console.log("[Square Sync] Complete:", stats);

    if (errors.length > 0 && stats.invoicesUpserted === 0 && stats.paymentsUpserted === 0) {
      return NextResponse.json({ error: `Sync failed: ${errors[0]}`, errors }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      stats,
      errors: errors.length > 0 ? errors : undefined,
      sinceDate: sinceDate ?? "all-time",
      message: [
        sinceDate ? `Incremental sync from ${sinceDate}.` : "Full history sync.",
        `Synced ${stats.invoicesUpserted}/${stats.invoicesFetched} invoices`,
        `(${stats.invoicesLinked} linked to families)`,
        `and ${stats.paymentsUpserted}/${stats.paymentsFetched} payments`,
        `across ${stats.locations} location(s).`,
        stats.customersLinked > 0 ? `Linked ${stats.customersLinked} new customers.` : "",
      ].filter(Boolean).join(" "),
    });
  } catch (err: any) {
    console.error("[Square Sync] Unexpected error:", err);
    return NextResponse.json({ error: err?.message ?? "Unexpected error during sync" }, { status: 500 });
  }
}

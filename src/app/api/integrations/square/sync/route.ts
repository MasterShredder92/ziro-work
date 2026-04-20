/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/**
 * Manual Square sync — pulls invoices, payments, and customers from Square API
 * and upserts into Supabase.
 *
 * POST /api/integrations/square/sync
 *
 * This route uses maxDuration = 300 (Vercel Pro) and returns a streaming
 * Server-Sent Events response so the browser gets live progress updates
 * without timing out.
 */

// Vercel Pro allows up to 300 seconds for serverless functions
export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  return money.amount;
}

function toDate(dt: string | null | undefined): string | null {
  if (!dt) return null;
  return dt.split("T")[0];
}

async function squareFetch(path: string, accessToken: string): Promise<{ ok: boolean; status: number; body: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`https://connect.squareup.com${path}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": "2024-01-17",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });
    let body: any;
    try { body = await res.json(); } catch { body = {}; }
    return { ok: res.ok, status: res.status, body };
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return { ok: false, status: 408, body: { errors: [{ detail: "Request timed out after 15s" }] } };
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: NextRequest) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Square access token not configured. Add SQUARE_ACCESS_TOKEN to environment variables." },
      { status: 503 }
    );
  }

  let sinceDate: string | null = null;
  try {
    const body = await req.json().catch(() => ({})) as { since?: string };
    if (body.since && /^\d{4}-\d{2}-\d{2}$/.test(body.since)) {
      sinceDate = body.since;
    }
  } catch { /* no body */ }

  const tenantId = DEFAULT_TENANT_ID;
  const db = getServiceClient();

  // ── Use Server-Sent Events so the browser gets live progress ──────────────
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

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
        send({ status: "running", message: "Fetching Square locations…" });

        // ── Step 1: Fetch all Square locations ──────────────────────────────
        const locRes = await squareFetch("/v2/locations", accessToken);
        if (!locRes.ok) {
          send({ status: "error", error: `Square locations fetch failed (${locRes.status})` });
          controller.close();
          return;
        }
        const locations: { id: string; name?: string }[] = locRes.body?.locations ?? [];
        if (locations.length === 0) {
          send({ status: "error", error: "No Square locations found for this account." });
          controller.close();
          return;
        }
        stats.locations = locations.length;
        send({ status: "running", message: `Found ${locations.length} location(s). Building customer map…` });

        // ── Step 2: Build customer → family/student lookup maps ─────────────
        const { data: familyRows } = await (db as any)
          .from("families")
          .select("id, square_customer_id")
          .eq("tenant_id", tenantId)
          .not("square_customer_id", "is", null);
        const customerToFamily: Record<string, string> = {};
        for (const f of (familyRows ?? [])) {
          if (f.square_customer_id) customerToFamily[f.square_customer_id] = f.id;
        }

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

        // ── Step 3: Fetch customers and link to families/students (non-blocking) ─
        send({ status: "running", message: "Syncing Square customers…" });
        try {
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
                if (stu.family_id) customerToFamily[squareCustId] = stu.family_id;
              }
            }
          }
        } catch (custErr: any) {
          // Customer sync is non-critical — log and continue to invoices + payments
          errors.push(`Customer sync skipped: ${custErr?.message ?? "unknown error"}`);
          console.warn("[Square Sync] Customer step failed, continuing:", custErr);
        }

        send({
          status: "running",
          message: `Matched ${stats.customersLinked} customers. Syncing invoices across ${locations.length} location(s)…`,
          stats: { ...stats },
        });

        // ── Step 4: Fetch invoices per location ──────────────────────────────
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

              if ((inv.status as string)?.toUpperCase() === "PAID") {
                for (const pr of paymentRequests) {
                  if (pr.completed_at) { row.paid_at = toDate(pr.completed_at); break; }
                }
              }

              return row;
            });

            for (let i = 0; i < rows.length; i += 50) {
              const batch = rows.slice(i, i + 50);
              const { error } = await (db as any)
                .from("square_invoices")
                .upsert(batch, { onConflict: "square_invoice_id" });
              if (error) { errors.push(error.message); }
              else { stats.invoicesUpserted += batch.length; }
            }

            // Send progress update every batch
            send({
              status: "running",
              message: `Invoices: ${stats.invoicesUpserted} synced so far…`,
              stats: { ...stats },
            });
          } while (cursor);
        }

        send({
          status: "running",
          message: `Invoices done (${stats.invoicesUpserted}). Syncing payments…`,
          stats: { ...stats },
        });

        // ── Step 5: Fetch payments per location ──────────────────────────────
        for (const loc of locations) {
          let cursor: string | undefined;
          do {
            const params = new URLSearchParams({ location_id: loc.id, limit: "100", sort_order: "ASC" });
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
                team_member_id: (pay.team_member_id as string) ?? null,
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

            // Send progress every batch
            if (stats.paymentsFetched % 500 === 0 || !cursor) {
              send({
                status: "running",
                message: `Payments: ${stats.paymentsUpserted} synced so far…`,
                stats: { ...stats },
              });
            }
          } while (cursor);
        }

        console.log("[Square Sync] Complete:", stats);

        const finalMessage = [
          sinceDate ? `Incremental sync from ${sinceDate}.` : "Full history sync complete.",
          `${stats.invoicesUpserted} invoices synced (${stats.invoicesLinked} linked to families).`,
          `${stats.paymentsUpserted} payments synced.`,
          stats.customersLinked > 0 ? `${stats.customersLinked} new customers linked.` : "",
          errors.length > 0 ? `${errors.length} non-fatal error(s).` : "",
        ].filter(Boolean).join(" ");

        send({
          status: "success",
          message: finalMessage,
          stats,
          errors: errors.length > 0 ? errors : undefined,
        });
      } catch (err: any) {
        console.error("[Square Sync] Unexpected error:", err);
        send({ status: "error", error: err?.message ?? "Unexpected error during sync" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

import { clientFor } from "@data/_client";
import {
  listSquareInvoices,
  listSquarePayments,
  listSquareRefunds,
} from "@data/squareInvoices";
import type { ToolDefinition, ToolInput, ToolOutput } from "./types";
import { validateInvoiceInput } from "./validators";

function requireTenant(input: ToolInput): string {
  if (!input.tenantId || input.tenantId.trim().length === 0) {
    throw new Error("tenantId is required");
  }
  return input.tenantId;
}

function internalInvoiceId(conversationId: string): string {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `INT-${conversationId.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

export const createInvoiceTool: ToolDefinition = {
  name: "createInvoice",
  description:
    "Create an invoice record. Validates customer linkage and amount. Defaults to an internal invoice number when Square id is not supplied.",
  handler: async (input: ToolInput): Promise<ToolOutput> => {
    const tenantId = requireTenant(input);
    const { args, errors } = validateInvoiceInput(input.args ?? input.raw);

    if (errors.length > 0) {
      return {
        result: { ok: false, errors },
        metadata: { validation_failed: true },
      };
    }

    const rawObj =
      typeof input.args === "object" && input.args !== null
        ? (input.args as Record<string, unknown>)
        : safeParse(input.raw);

    const squareInvoiceId =
      pickString(rawObj, [
        "square_invoice_id",
        "squareInvoiceId",
        "external_id",
      ]) ?? internalInvoiceId(input.conversationId ?? "x");

    const customerName = pickString(rawObj, ["customer_name", "name"]);
    const customerEmail = pickString(rawObj, ["customer_email", "email"]);
    const locationId = pickString(rawObj, ["location_id", "locationId"]);

    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from("square_invoices")
      .insert({
        tenant_id: tenantId,
        square_invoice_id: squareInvoiceId,
        family_id: args.family_id,
        amount_cents: args.amount_cents,
        requested_amount: args.amount_cents,
        due_date: args.due_date,
        title: args.description,
        invoice_number: args.invoice_number ?? squareInvoiceId,
        square_customer_id: args.customer_id,
        customer_name: customerName,
        customer_email: customerEmail,
        location_id: locationId,
        status: "draft",
        raw_data: args.metadata as Record<string, unknown>,
      })
      .select("*")
      .single();

    if (error) {
      return {
        result: { ok: false, errors: [error.message] },
        metadata: { db_error: true, code: error.code ?? null },
      };
    }

    return {
      result: { ok: true, invoice: data },
      metadata: {
        entity: "square_invoice",
        action: "create",
        invoice_id: data?.id ?? null,
        square_invoice_id: squareInvoiceId,
      },
    };
  },
};

export const recordPaymentTool: ToolDefinition = {
  name: "recordPayment",
  description:
    "Record a payment against Square payment facts. Requires amount, reporting_date, and either a Square payment id or idempotency hint.",
  handler: async (input: ToolInput): Promise<ToolOutput> => {
    const tenantId = requireTenant(input);
    const rawObj =
      typeof input.args === "object" && input.args !== null
        ? (input.args as Record<string, unknown>)
        : safeParse(input.raw);
    const errors: string[] = [];

    const amountRaw = rawObj.amount ?? rawObj.amount_cents ?? rawObj.total;
    let amountCents: number | null = null;
    if (typeof amountRaw === "number") amountCents = Math.round(amountRaw * 100);
    else if (typeof amountRaw === "string") {
      const parsed = Number.parseFloat(amountRaw.replace(/[^\d.\-]/g, ""));
      if (Number.isFinite(parsed)) amountCents = Math.round(parsed * 100);
    }

    const reportingDate =
      pickString(rawObj, ["reporting_date", "date"]) ??
      new Date().toISOString().slice(0, 10);
    const squarePaymentId =
      pickString(rawObj, ["square_payment_id", "payment_id", "external_id"]) ??
      `INT-PMT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const status = (pickString(rawObj, ["status"]) ?? "completed").toLowerCase();
    const tender = (pickString(rawObj, ["tender_bucket", "tender"]) ?? "other").toLowerCase();
    const locationId = pickString(rawObj, ["location_id", "locationId"]);

    if (amountCents === null) errors.push("amount is required and must be numeric");
    else if (amountCents <= 0) errors.push("amount must be greater than zero");

    if (errors.length > 0) {
      return {
        result: { ok: false, errors },
        metadata: { validation_failed: true },
      };
    }

    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
      .from("square_payments_fact")
      .insert({
        tenant_id: tenantId,
        square_payment_id: squarePaymentId,
        reporting_date: reportingDate,
        status,
        tender_bucket: tender,
        amount_money_cents: amountCents,
        total_money_cents: amountCents,
        net_total_cents: amountCents,
        location_id: locationId,
        raw_json: rawObj as Record<string, unknown>,
      })
      .select("*")
      .single();

    if (error) {
      return {
        result: { ok: false, errors: [error.message] },
        metadata: { db_error: true, code: error.code ?? null },
      };
    }

    return {
      result: { ok: true, payment: data },
      metadata: {
        entity: "square_payment",
        action: "record",
        payment_id: data?.id ?? null,
        square_payment_id: squarePaymentId,
      },
    };
  },
};

export const reconcileSquareTool: ToolDefinition = {
  name: "reconcileSquare",
  description:
    "Reconcile invoices, payments, and refunds for a tenant. Returns totals and a list of invoices that still have outstanding balances.",
  handler: async (input: ToolInput): Promise<ToolOutput> => {
    const tenantId = requireTenant(input);
    const rawObj =
      typeof input.args === "object" && input.args !== null
        ? (input.args as Record<string, unknown>)
        : safeParse(input.raw);

    const limit =
      typeof rawObj.limit === "number"
        ? rawObj.limit
        : typeof rawObj.limit === "string"
          ? Number.parseInt(rawObj.limit, 10)
          : 200;

    const [invoices, payments, refunds] = await Promise.all([
      listSquareInvoices(tenantId, undefined, { limit }),
      listSquarePayments(tenantId, { limit }),
      listSquareRefunds(tenantId, { limit }),
    ]);

    const totalInvoiced = invoices.reduce(
      (sum, i) => sum + (i.amount_cents ?? 0),
      0,
    );
    const totalPaid = payments.reduce(
      (sum, p) => sum + (p.net_total_cents ?? p.amount_money_cents ?? 0),
      0,
    );
    const totalRefunded = refunds.reduce(
      (sum, r) => sum + (r.amount_money_cents ?? 0),
      0,
    );

    const outstanding = invoices
      .filter((i) => {
        const amount = i.amount_cents ?? 0;
        const paid = i.amount_paid ?? 0;
        return amount > paid;
      })
      .map((i) => ({
        id: i.id,
        square_invoice_id: i.square_invoice_id,
        family_id: i.family_id,
        amount_cents: i.amount_cents ?? 0,
        amount_paid: i.amount_paid ?? 0,
        balance_cents: (i.amount_cents ?? 0) - (i.amount_paid ?? 0),
        due_date: i.due_date,
        status: i.status,
      }));

    return {
      result: {
        ok: true,
        totals: {
          invoiced_cents: totalInvoiced,
          paid_cents: totalPaid,
          refunded_cents: totalRefunded,
          net_cents: totalPaid - totalRefunded,
          outstanding_count: outstanding.length,
        },
        outstanding,
        counts: {
          invoices: invoices.length,
          payments: payments.length,
          refunds: refunds.length,
        },
      },
      metadata: {
        entity: "square",
        action: "reconcile",
        outstanding_count: outstanding.length,
      },
    };
  },
};

function pickString(
  obj: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === "object" && !Array.isArray(p))
      return p as Record<string, unknown>;
  } catch {
    // ignore
  }
  return {};
}

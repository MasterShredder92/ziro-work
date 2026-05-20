/**
 * Resolve a Square Customer ID for a ZiroWork family.
 *
 * Strategy (idempotent):
 *   1. If family.square_customer_id is set → return it.
 *   2. Search Square by exact email → return + cache.
 *   3. Search Square by exact phone (E.164) → return + cache.
 *   4. Create a new Square Customer → return + cache.
 *
 * Cache writes go to families.square_customer_id so the same Square ID
 * is permanent and never duplicated on future invoices.
 */

import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";

const SQUARE_API = "https://connect.squareup.com";
const SQUARE_VERSION = "2024-01-17";

export type FamilyForSquareResolve = {
  id: string;
  tenant_id: string;
  name: string | null;
  primary_email: string | null;
  primary_phone: string | null;
  square_customer_id: string | null;
};

export type ResolveResult = {
  squareCustomerId: string;
  matchSource: "cached" | "search_email" | "search_phone" | "created";
  cached: boolean;
};

async function squareCall<T = unknown>(
  path: string,
  method: "POST" | "GET",
  body: unknown,
  token: string
): Promise<{ ok: boolean; status: number; body: T & { errors?: Array<{ detail: string; code: string }> } }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(`${SQUARE_API}${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json: unknown = {};
    try {
      json = await res.json();
    } catch {
      json = {};
    }
    return { ok: res.ok, status: res.status, body: json as T & { errors?: Array<{ detail: string; code: string }> } };
  } finally {
    clearTimeout(timer);
  }
}

function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw.startsWith("+") ? raw : null;
}

function splitName(full: string | null): { given: string; family: string } {
  if (!full) return { given: "", family: "" };
  const trimmed = full.trim().replace(/\s+/g, " ");
  // Strip "Family" or "the X family" patterns
  const cleaned = trimmed.replace(/\s+family$/i, "").replace(/^the\s+/i, "");
  const parts = cleaned.split(" ");
  if (parts.length === 1) return { given: parts[0], family: "" };
  return { given: parts.slice(0, -1).join(" "), family: parts[parts.length - 1] };
}

export async function resolveSquareCustomer(
  family: FamilyForSquareResolve,
  options?: { dryRun?: boolean }
): Promise<ResolveResult> {
  if (family.square_customer_id) {
    return { squareCustomerId: family.square_customer_id, matchSource: "cached", cached: true };
  }

  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    throw new Error("SQUARE_ACCESS_TOKEN not configured");
  }

  const dryRun = !!options?.dryRun;
  assertServiceRoleAllowed("src/lib/billing/squareCustomerResolver.ts — service-role module; internal/background operations only");
  const db = getServiceClient();

  // ── 1. Search by email ──
  if (family.primary_email) {
    const search = await squareCall<{ customers?: Array<{ id: string; email_address?: string }> }>(
      "/v2/customers/search",
      "POST",
      {
        limit: 10,
        query: {
          filter: { email_address: { exact: family.primary_email } },
        },
      },
      token
    );
    const match = search.body.customers?.[0];
    if (search.ok && match?.id) {
      if (!dryRun) {
        await db
          .from("families")
          .update({ square_customer_id: match.id })
          .eq("id", family.id);
      }
      return { squareCustomerId: match.id, matchSource: "search_email", cached: false };
    }
  }

  // ── 2. Search by phone ──
  const phone = normalizePhone(family.primary_phone);
  if (phone) {
    const search = await squareCall<{ customers?: Array<{ id: string; phone_number?: string }> }>(
      "/v2/customers/search",
      "POST",
      {
        limit: 10,
        query: {
          filter: { phone_number: { exact: phone } },
        },
      },
      token
    );
    const match = search.body.customers?.[0];
    if (search.ok && match?.id) {
      if (!dryRun) {
        await db
          .from("families")
          .update({ square_customer_id: match.id })
          .eq("id", family.id);
      }
      return { squareCustomerId: match.id, matchSource: "search_phone", cached: false };
    }
  }

  // ── 3. Create new Square customer ──
  const { given, family: familyName } = splitName(family.name);
  if (!given && !family.primary_email && !phone) {
    throw new Error("Cannot create Square customer: no name, email, or phone on family.");
  }

  const idempotencyKey = `fam-${family.id}`;
  const create = await squareCall<{ customer?: { id: string } }>(
    "/v2/customers",
    "POST",
    {
      idempotency_key: idempotencyKey,
      given_name: given || family.name || "Customer",
      family_name: familyName || undefined,
      email_address: family.primary_email || undefined,
      phone_number: phone || undefined,
      reference_id: family.id, // ZiroWork family id stored on the Square customer
      note: "Created by ZiroWork CRM",
    },
    token
  );
  if (!create.ok || !create.body.customer?.id) {
    const err = create.body.errors?.[0]?.detail || `Customer create failed (${create.status})`;
    throw new Error(`Square Customer create: ${err}`);
  }
  const newId = create.body.customer.id;
  if (!dryRun) {
    await db
      .from("families")
      .update({ square_customer_id: newId })
      .eq("id", family.id);
  }
  return { squareCustomerId: newId, matchSource: "created", cached: false };
}

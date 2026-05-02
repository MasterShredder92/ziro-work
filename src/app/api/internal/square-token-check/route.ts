/**
 * GET /api/internal/square-token-check
 *
 * Verifies the SQUARE_ACCESS_TOKEN has all the scopes we need
 * for the ZiroWork → Square push flow.
 *
 * Auth: requires header `x-internal-key: $INTERNAL_API_KEY`.
 *
 * Probes (READ ONLY — does not create anything):
 *   1. /v2/locations           → MERCHANT_PROFILE_READ
 *   2. /v2/customers/search    → CUSTOMERS_READ
 *   3. /v2/invoices/search     → INVOICES_READ
 *   4. /v2/payments (limit 1)  → PAYMENTS_READ
 *   5. /oauth2/token/status    → token type + scopes
 *
 * Returns a checklist + raw scope list so we know exactly
 * what's allowed before turning on the push checkbox.
 */

import { NextRequest, NextResponse } from "next/server";

const SQUARE_API = "https://connect.squareup.com";
const SQUARE_VERSION = "2024-01-17";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProbeResult = {
  name: string;
  ok: boolean;
  status: number;
  detail: string;
  required_scope: string;
};

async function probe(
  name: string,
  path: string,
  method: "GET" | "POST",
  body: unknown,
  token: string,
  required_scope: string
): Promise<ProbeResult> {
  try {
    const res = await fetch(`${SQUARE_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json: { errors?: Array<{ detail: string; code: string }> } = {};
    try {
      json = await res.json();
    } catch {
      json = {};
    }
    return {
      name,
      ok: res.ok,
      status: res.status,
      detail: res.ok
        ? "OK"
        : json.errors?.map((e) => `${e.code}: ${e.detail}`).join("; ") ||
          `HTTP ${res.status}`,
      required_scope,
    };
  } catch (e) {
    return {
      name,
      ok: false,
      status: 0,
      detail: e instanceof Error ? e.message : String(e),
      required_scope,
    };
  }
}

export async function GET(req: NextRequest) {
  const expectedKey = process.env.INTERNAL_API_KEY;
  if (!expectedKey) {
    return NextResponse.json({ error: "INTERNAL_API_KEY not configured" }, { status: 503 });
  }
  if (req.headers.get("x-internal-key") !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "SQUARE_ACCESS_TOKEN not configured" }, { status: 503 });
  }

  // ── Token status (works for OAuth-issued tokens; PAT may return 401) ──
  let tokenInfo: {
    type: "OAuth" | "Personal Access Token (likely)";
    scopes: string[];
    expires_at?: string | null;
    merchant_id?: string | null;
  } = { type: "Personal Access Token (likely)", scopes: [] };
  try {
    const statusRes = await fetch(`${SQUARE_API}/oauth2/token/status`, {
      method: "POST",
      headers: {
        Authorization: `Client ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
    });
    if (statusRes.ok) {
      const j = await statusRes.json();
      tokenInfo = {
        type: "OAuth",
        scopes: Array.isArray(j.scopes) ? j.scopes : [],
        expires_at: j.expires_at ?? null,
        merchant_id: j.merchant_id ?? null,
      };
    }
  } catch {
    // ignore — fall back to "PAT likely"
  }

  // ── Read-only probes (do NOT create or modify anything) ──
  const probes: ProbeResult[] = await Promise.all([
    probe("locations.list", "/v2/locations", "GET", null, token, "MERCHANT_PROFILE_READ"),
    probe(
      "customers.search",
      "/v2/customers/search",
      "POST",
      { limit: 1 },
      token,
      "CUSTOMERS_READ"
    ),
    probe(
      "invoices.search",
      "/v2/invoices/search",
      "POST",
      { query: { filter: { location_ids: ["LVE6DMP299BR6"] } }, limit: 1 },
      token,
      "INVOICES_READ"
    ),
    probe("payments.list", "/v2/payments?limit=1", "GET", null, token, "PAYMENTS_READ"),
  ]);

  // ── Verdict ──
  const writeRequired = [
    "CUSTOMERS_WRITE",
    "ORDERS_WRITE",
    "INVOICES_WRITE",
    "PAYMENTS_WRITE",
  ];
  const writeMissing =
    tokenInfo.scopes.length > 0
      ? writeRequired.filter((s) => !tokenInfo.scopes.includes(s))
      : null; // unknown when scopes not reported
  const readAllOK = probes.every((p) => p.ok);

  const verdict =
    !readAllOK
      ? "FAIL — read probes failed; token cannot be used."
      : writeMissing === null
        ? "READ OK — write scopes unknown (likely PAT with full access). Safe to test push with a $1 invoice."
        : writeMissing.length === 0
          ? "PASS — all required scopes confirmed."
          : `BLOCK — token is missing write scopes: ${writeMissing.join(", ")}`;

  return NextResponse.json(
    {
      verdict,
      token_info: tokenInfo,
      read_probes: probes,
      required_write_scopes: writeRequired,
      missing_write_scopes: writeMissing,
    },
    { status: 200 }
  );
}

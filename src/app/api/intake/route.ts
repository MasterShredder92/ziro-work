import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";

type IntakePayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  location?: unknown;
  message?: unknown;
  source?: unknown;
};

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

type JsonObject = Record<string, unknown>;

function serializeUnknownError(err: unknown): {
  name?: string;
  message: string;
  stack?: string;
  code?: string;
  details?: string;
  hint?: string;
} {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: (err as { code?: string }).code,
      details: (err as { details?: string }).details,
      hint: (err as { hint?: string }).hint,
    };
  }

  if (typeof err === "string") return { message: err };

  if (err && typeof err === "object") {
    const e = err as {
      name?: unknown;
      message?: unknown;
      stack?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    return {
      name: typeof e.name === "string" ? e.name : undefined,
      message: typeof e.message === "string" ? e.message : "Unknown error",
      stack: typeof e.stack === "string" ? e.stack : undefined,
      code: typeof e.code === "string" ? e.code : undefined,
      details: typeof e.details === "string" ? e.details : undefined,
      hint: typeof e.hint === "string" ? e.hint : undefined,
    };
  }

  return { message: "Unknown error" };
}

function isMissingTableError(err: unknown): boolean {
  const e = err as { code?: unknown; message?: unknown; details?: unknown };
  const code = typeof e?.code === "string" ? e.code : undefined;
  const msg = typeof e?.message === "string" ? e.message : "";
  const details = typeof e?.details === "string" ? e.details : "";

  // Postgres: undefined_table
  if (code === "42P01") return true;
  // PostgREST error message variants
  return (
    /relation .* does not exist/i.test(msg) ||
    /does not exist/i.test(details) ||
    /undefined_table/i.test(msg)
  );
}

async function logStructuredError(args: {
  supabase: ReturnType<typeof getServiceClient>;
  event: string;
  err: unknown;
  context?: JsonObject;
}) {
  const error = serializeUnknownError(args.err);
  const payload = {
    event: args.event,
    error,
    context: args.context ?? {},
    occurred_at: new Date().toISOString(),
  } satisfies JsonObject;

  console.error("[intake] error", payload);

  // Best-effort: insert only if `error_logs` exists (no schema changes allowed).
  try {
    const res = await args.supabase.from("error_logs").insert({
      event: payload.event,
      error: payload.error,
      context: payload.context,
      occurred_at: payload.occurred_at,
    });
    if (res.error && isMissingTableError(res.error)) return;
  } catch (e) {
    if (isMissingTableError(e)) return;
  }
}

function asOptionalTrimmedString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

function isValidEmail(email: string): boolean {
  // Intentionally simple: reject obvious invalids without being overly strict.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").slice(0, 32);
}

async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

function pickRequestMeta(req: NextRequest): {
  ip: string | null;
  userAgent: string | null;
  referer: string | null;
  origin: string | null;
} {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  return {
    ip,
    userAgent: req.headers.get("user-agent"),
    referer: req.headers.get("referer"),
    origin: req.headers.get("origin"),
  };
}

function validateAndNormalize(body: unknown): {
  ok: true;
  value: {
    tenantId: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    message: string | null;
    source: string | null;
  };
} | {
  ok: false;
  error: string;
} {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Expected JSON object body." };
  }

  const b = body as IntakePayload;

  const name = asOptionalTrimmedString(b.name);
  const emailRaw = asOptionalTrimmedString(b.email);
  const phoneRaw = asOptionalTrimmedString(b.phone);
  const location = asOptionalTrimmedString(b.location);
  const message = asOptionalTrimmedString(b.message);
  const source = asOptionalTrimmedString(b.source);

  const email = emailRaw ? emailRaw.toLowerCase() : null;
  if (email && !isValidEmail(email)) {
    return { ok: false, error: "Invalid email." };
  }

  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;

  if (!name && !email && !phone) {
    return { ok: false, error: "Provide at least one of: name, email, phone." };
  }

  // Keep payload sizes bounded.
  if (name && name.length > 200) return { ok: false, error: "name too long." };
  if (email && email.length > 254) return { ok: false, error: "email too long." };
  if (phone && phone.length > 32) return { ok: false, error: "phone too long." };
  if (location && location.length > 200) return { ok: false, error: "location too long." };
  if (source && source.length > 200) return { ok: false, error: "source too long." };
  if (message && message.length > 4000) return { ok: false, error: "message too long." };

  return {
    ok: true,
    value: {
      tenantId: DEFAULT_TENANT_ID,
      name,
      email,
      phone,
      location,
      message,
      source,
    },
  };
}

async function insertIntakeLog(args: {
  supabase: ReturnType<typeof getServiceClient>;
  tenantId: string;
  lead: {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    message: string | null;
    source: string | null;
  };
  meta: ReturnType<typeof pickRequestMeta>;
  rawPayload: unknown;
}) {
  const now = new Date().toISOString();
  const baseRow = {
    tenant_id: args.tenantId,
    name: args.lead.name,
    email: args.lead.email,
    phone: args.lead.phone,
    location: args.lead.location,
    message: args.lead.message,
    source: args.lead.source,
    ip: args.meta.ip,
    user_agent: args.meta.userAgent,
    referer: args.meta.referer,
    origin: args.meta.origin,
    raw_payload: args.rawPayload,
    created_at: now,
  } as const;

  // Because `intake_logs` is legacy and we’re not allowed to change schemas,
  // attempt a rich insert first, then fall back to minimal rows if columns differ.
  let attempt1Err: unknown = null;
  try {
    const attempt1 = await args.supabase.from("intake_logs").insert(baseRow);
    if (!attempt1.error) return;
    attempt1Err = attempt1.error;
  } catch (e) {
    attempt1Err = e;
  }

  let attempt2Err: unknown = null;
  try {
    const attempt2 = await args.supabase.from("intake_logs").insert({
      tenant_id: args.tenantId,
      raw_payload: args.rawPayload,
      created_at: now,
    });
    if (!attempt2.error) return;
    attempt2Err = attempt2.error;
  } catch (e) {
    attempt2Err = e;
  }

  let attempt3Err: unknown = null;
  try {
    const attempt3 = await args.supabase.from("intake_logs").insert({
      raw_payload: args.rawPayload,
      created_at: now,
    });
    if (!attempt3.error) return;
    attempt3Err = attempt3.error;
  } catch (e) {
    attempt3Err = e;
  }

  // Surface the first error, but include the fallbacks in the log for debugging.
  throw new Error(
    `intake_logs insert failed: ${serializeUnknownError(attempt1Err).message} (fallbacks: ${serializeUnknownError(attempt2Err).message} | ${serializeUnknownError(attempt3Err).message})`
  );
}

async function insertLegacyLead(args: {
  supabase: ReturnType<typeof getServiceClient>;
  tenantId: string;
  lead: {
    name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    message: string | null;
    source: string | null;
  };
}) {
  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    tenant_id: args.tenantId,
    name: args.lead.name,
    email: args.lead.email,
    phone: args.lead.phone,
    location: args.lead.location,
    message: args.lead.message,
    source: args.lead.source,
    created_at: now,
  };

  try {
    const { error } = await args.supabase.from("leads").insert(row);
    if (error) throw error;
  } catch (err) {
    throw new Error(`leads insert failed: ${serializeUnknownError(err).message}`);
  }
}

export async function POST(req: NextRequest) {
  assertServiceRoleAllowed("Public intake form — anonymous lead capture, no auth");
  const rawPayload = await readJson(req);
  const meta = pickRequestMeta(req);

  console.log("[intake] request", {
    ip: meta.ip,
    userAgent: meta.userAgent,
    origin: meta.origin,
    referer: meta.referer,
    rawPayload,
  });

  const parsed = validateAndNormalize(rawPayload);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
  }

  const { tenantId, ...lead } = parsed.value;
  const supabase = getServiceClient();

  try {
    await insertIntakeLog({ supabase, tenantId, lead, meta, rawPayload });
    await insertLegacyLead({ supabase, tenantId, lead });
    return NextResponse.json({ success: true });
  } catch (err) {
    await logStructuredError({
      supabase,
      event: "api.intake.POST",
      err,
      context: {
        tenantId,
        ip: meta.ip,
        userAgent: meta.userAgent,
        origin: meta.origin,
        referer: meta.referer,
        lead,
      },
    });
    return NextResponse.json(
      { success: false, error: serializeUnknownError(err).message },
      { status: 500 }
    );
  }
}


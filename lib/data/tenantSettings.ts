import { clientFor } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "tenant_settings";

export type TenantSettingsRow = {
  tenant_id: string;
  branding: Record<string, unknown>;
  billing: Record<string, unknown>;
  scheduling: Record<string, unknown>;
  messaging: Record<string, unknown>;
  automation: Record<string, unknown>;
  forms: Record<string, unknown>;
  storage: Record<string, unknown>;
  metadata: Record<string, unknown>;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

type GlobalWithStore = typeof globalThis & {
  __ziro_tenant_settings_store?: Map<string, TenantSettingsRow>;
};

function store(): Map<string, TenantSettingsRow> {
  const g = globalThis as GlobalWithStore;
  if (!g.__ziro_tenant_settings_store) {
    g.__ziro_tenant_settings_store = new Map();
  }
  return g.__ziro_tenant_settings_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function defaultSettings(tenantId: string): TenantSettingsRow {
  const now = nowIso();
  return {
    tenant_id: tenantId,
    branding: {
      name: null,
      logo_url: null,
      primary_color: null,
      accent_color: null,
      timezone: "America/New_York",
      locale: "en-US",
    },
    billing: {
      invoice_prefix: "INV-",
      default_net_days: 14,
      default_tax_rate_bp: 0,
      default_currency: "USD",
      payment_methods: ["card"],
      late_fee_cents: 0,
    },
    scheduling: {
      default_lesson_minutes: 30,
      default_buffer_minutes: 5,
      business_hours: { start: "09:00", end: "21:00" },
      work_days: [1, 2, 3, 4, 5],
    },
    messaging: {
      email_provider: "resend",
      email_from: null,
      sms_provider: null,
      default_reply_to: null,
      quiet_hours: { start: "21:00", end: "08:00" },
    },
    automation: {
      rate_limit_per_minute: 60,
      max_concurrent_executions: 10,
      retry_attempts: 3,
      retry_backoff_ms: 60_000,
    },
    forms: {
      allow_public_forms: true,
      require_captcha: false,
      default_success_message: "Thanks for your submission.",
      max_submissions_per_minute: 10,
    },
    storage: {
      max_upload_mb: 25,
      retention_days: 365,
      allowed_mime_types: ["image/*", "application/pdf", "audio/*", "video/*"],
    },
    metadata: {},
    updated_by: null,
    created_at: now,
    updated_at: now,
  };
}

export type TenantSettingsUpdate = Partial<
  Omit<TenantSettingsRow, "tenant_id" | "created_at">
>;

export async function getTenantSettings(
  tenantId: string,
): Promise<TenantSettingsRow> {
  if (tableMissing(TABLE)) {
    const existing = store().get(tenantId);
    if (existing) return existing;
    const fresh = defaultSettings(tenantId);
    store().set(tenantId, fresh);
    return fresh;
  }
  try {
    const supabase = await clientFor(tenantId);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      const fresh = defaultSettings(tenantId);
      return fresh;
    }
    return data as unknown as TenantSettingsRow;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      return getTenantSettings(tenantId);
    }
    throw err;
  }
}

function mergeDeep(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const prev = next[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      prev &&
      typeof prev === "object" &&
      !Array.isArray(prev)
    ) {
      next[key] = mergeDeep(
        prev as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      next[key] = value;
    }
  }
  return next;
}

export async function updateTenantSettings(
  tenantId: string,
  patch: TenantSettingsUpdate,
): Promise<TenantSettingsRow> {
  const existing = await getTenantSettings(tenantId);
  const next: TenantSettingsRow = {
    ...existing,
    branding: patch.branding
      ? mergeDeep(existing.branding, patch.branding)
      : existing.branding,
    billing: patch.billing
      ? mergeDeep(existing.billing, patch.billing)
      : existing.billing,
    scheduling: patch.scheduling
      ? mergeDeep(existing.scheduling, patch.scheduling)
      : existing.scheduling,
    messaging: patch.messaging
      ? mergeDeep(existing.messaging, patch.messaging)
      : existing.messaging,
    automation: patch.automation
      ? mergeDeep(existing.automation, patch.automation)
      : existing.automation,
    forms: patch.forms
      ? mergeDeep(existing.forms, patch.forms)
      : existing.forms,
    storage: patch.storage
      ? mergeDeep(existing.storage, patch.storage)
      : existing.storage,
    metadata: patch.metadata
      ? mergeDeep(existing.metadata, patch.metadata)
      : existing.metadata,
    updated_by: patch.updated_by ?? existing.updated_by,
    updated_at: nowIso(),
  };

  if (tableMissing(TABLE)) {
    store().set(tenantId, next);
    return next;
  }
  try {
    const supabase = await clientFor(tenantId);
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(next, { onConflict: "tenant_id" })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as TenantSettingsRow;
  } catch (err) {
    if (isMissingTableError(err, TABLE)) {
      markTableMissing(TABLE);
      store().set(tenantId, next);
      return next;
    }
    throw err;
  }
}

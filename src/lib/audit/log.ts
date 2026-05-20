import "server-only";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";
import { getSession } from "@/lib/auth/session";

export type AuditPayload = Record<string, unknown> | null | undefined;

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

type GlobalWithFlag = typeof globalThis & {
  __ziro_audit_table_missing?: boolean;
};

const g = globalThis as GlobalWithFlag;

function tableMissing(): boolean {
  return g.__ziro_audit_table_missing === true;
}

function markTableMissing(): void {
  g.__ziro_audit_table_missing = true;
}

function sanitizePayload(payload: AuditPayload): Record<string, unknown> | null {
  if (!payload) return null;
  if (typeof payload !== "object") return null;
  try {
    return JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const rec = err as Record<string, unknown>;
  const code = typeof rec.code === "string" ? rec.code : null;
  const message = typeof rec.message === "string" ? rec.message : "";
  if (code === "42P01") return true;
  if (code === "PGRST205") return true;
  // Match both old typo and correct name for safety
  if (/relation .*audit_log.* does not exist/i.test(message)) return true;
  if (/Could not find the table .*audit_log/i.test(message)) return true;
  return false;
}

/**
 * logAudit — writes an app-level event to the audit_log table.
 *
 * Column mapping (audit_log schema):
 *   action      ← event (what happened)
 *   new_value   ← payload (jsonb context)
 *   performed_by← profile_id (uuid of the acting user)
 *   user_role   ← role
 *   tenant_id   ← session.tenantId (uuid NOT NULL)
 *   table_name  ← "app_event" sentinel (required NOT NULL)
 */
export async function logAudit(
  event: string,
  payload: AuditPayload = null,
): Promise<void> {
  if (!event || typeof event !== "string") return;
  if (tableMissing()) return;

  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await getSession();
  } catch {
    session = null;
  }

  assertServiceRoleAllowed("src/lib/audit/log.ts — service-role module; internal/background operations only");
  const supabase = getServiceClient();
  const row: Record<string, unknown> = {
    action: event,
    new_value: sanitizePayload(payload),
    performed_by: session?.userId ?? null,
    user_role: session?.role ?? null,
    tenant_id: session?.tenantId ?? DEFAULT_TENANT_ID,
    table_name: "app_event",
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from("audit_log").insert(row);
    if (error) {
      if (isMissingTableError(error)) {
        markTableMissing();
        return;
      }
      // Passive — never throw, never block main thread
      return;
    }
  } catch (err) {
    if (isMissingTableError(err)) markTableMissing();
    return;
  }
}

/**
 * logAuditWithContext — same as logAudit but accepts explicit context
 * for use in server actions where session may not be available.
 */
export async function logAuditWithContext(
  event: string,
  context: {
    tenantId?: string | null;
    profileId?: string | null;
    role?: string | null;
  },
  payload: AuditPayload = null,
): Promise<void> {
  if (!event || typeof event !== "string") return;
  if (tableMissing()) return;
  const supabase = getServiceClient();
  const row: Record<string, unknown> = {
    action: event,
    new_value: sanitizePayload(payload),
    performed_by: context.profileId ?? null,
    user_role: context.role ?? null,
    tenant_id: context.tenantId ?? DEFAULT_TENANT_ID,
    table_name: "app_event",
    created_at: new Date().toISOString(),
  };
  try {
    const { error } = await supabase.from("audit_log").insert(row);
    if (error && isMissingTableError(error)) {
      markTableMissing();
    }
    // Passive — never throw
  } catch (err) {
    if (isMissingTableError(err)) markTableMissing();
  }
}

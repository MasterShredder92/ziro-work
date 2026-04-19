import "server-only";
import { getServiceClient } from "@/lib/supabase";
import { getSession } from "@/lib/auth/session";

export type AuditPayload = Record<string, unknown> | null | undefined;

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
  if (/relation .*audit_logs.* does not exist/i.test(message)) return true;
  if (/Could not find the table .*audit_logs/i.test(message)) return true;
  return false;
}

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

  const supabase = getServiceClient();
  const row: Record<string, unknown> = {
    event,
    payload: sanitizePayload(payload),
    profile_id: session?.userId ?? null,
    tenant_id: session?.tenantId ?? null,
    role: session?.role ?? null,
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from("audit_logs").insert(row);
    if (error) {
      if (isMissingTableError(error)) {
        markTableMissing();
        return;
      }
      return;
    }
  } catch (err) {
    if (isMissingTableError(err)) markTableMissing();
    return;
  }
}

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
    event,
    payload: sanitizePayload(payload),
    profile_id: context.profileId ?? null,
    tenant_id: context.tenantId ?? null,
    role: context.role ?? null,
    created_at: new Date().toISOString(),
  };
  try {
    const { error } = await supabase.from("audit_logs").insert(row);
    if (error && isMissingTableError(error)) {
      markTableMissing();
    }
  } catch (err) {
    if (isMissingTableError(err)) markTableMissing();
  }
}

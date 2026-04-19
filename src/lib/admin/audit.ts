import "server-only";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import {
  insertAuditLog,
  listAuditLogs,
  purgeOlderThan,
  type AuditLogFilter,
  type AuditLogRow,
} from "@data/auditLogs";

export type DiffEntry = {
  path: string;
  before: unknown;
  after: unknown;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

export function diffObjects(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  prefix = "",
): DiffEntry[] {
  const out: DiffEntry[] = [];
  const b = before ?? {};
  const a = after ?? {};
  const keys = new Set<string>([...Object.keys(b), ...Object.keys(a)]);
  for (const key of keys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const bv = (b as Record<string, unknown>)[key];
    const av = (a as Record<string, unknown>)[key];
    if (isPlainObject(bv) && isPlainObject(av)) {
      out.push(...diffObjects(bv, av, path));
      continue;
    }
    if (JSON.stringify(bv ?? null) !== JSON.stringify(av ?? null)) {
      out.push({ path, before: bv ?? null, after: av ?? null });
    }
  }
  return out;
}

export type AuditRecordInput = {
  tenantId: string;
  event: string;
  category?: string;
  targetType?: string;
  targetId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  payload?: Record<string, unknown> | null;
};

async function resolveActor(): Promise<{
  id: string | null;
  role: string | null;
  ip: string | null;
}> {
  let actorId: string | null = null;
  let actorRole: string | null = null;
  try {
    const session = await getSession();
    actorId = session?.userId ?? null;
    actorRole = session?.role ?? null;
  } catch {
    actorId = null;
  }
  let ip: string | null = null;
  try {
    const h = await headers();
    ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;
  } catch {
    ip = null;
  }
  return { id: actorId, role: actorRole, ip };
}

export async function recordAudit(
  input: AuditRecordInput,
): Promise<AuditLogRow> {
  const actor = await resolveActor();
  const diff =
    input.before || input.after
      ? diffObjects(input.before ?? null, input.after ?? null).map(
          (d) => d as unknown as Record<string, unknown>,
        )
      : null;
  return insertAuditLog(input.tenantId, {
    event: input.event,
    category: input.category ?? null,
    actor_id: actor.id,
    actor_role: actor.role,
    actor_ip: actor.ip,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
    diff,
    payload: input.payload ?? null,
  });
}

export async function searchAudit(
  tenantId: string,
  filter: AuditLogFilter = {},
): Promise<AuditLogRow[]> {
  return listAuditLogs(tenantId, filter);
}

export async function applyRetentionPolicy(
  tenantId: string,
  retentionDays: number,
): Promise<number> {
  if (!retentionDays || retentionDays <= 0) return 0;
  const cutoff = new Date(
    Date.now() - retentionDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  return purgeOlderThan(tenantId, cutoff);
}

export function exportAuditCsv(rows: AuditLogRow[]): string {
  const header = [
    "id",
    "created_at",
    "event",
    "category",
    "actor_id",
    "actor_role",
    "target_type",
    "target_id",
  ].join(",");
  const lines = rows.map((r) =>
    [
      r.id,
      r.created_at,
      r.event,
      r.category ?? "",
      r.actor_id ?? "",
      r.actor_role ?? "",
      r.target_type ?? "",
      r.target_id ?? "",
    ]
      .map((v) =>
        typeof v === "string" && /[",\n]/.test(v)
          ? `"${v.replace(/"/g, '""')}"`
          : String(v ?? ""),
      )
      .join(","),
  );
  return [header, ...lines].join("\n");
}

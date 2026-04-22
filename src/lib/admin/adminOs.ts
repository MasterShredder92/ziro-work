import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { listAuditLogs } from "@data/auditLogs";
import { listRoles } from "@data/roles";
import { listFeatureFlags } from "@data/featureFlags";
import { tableMissing } from "@data/_missingTable";
import { getTenant } from "@data/tenants";
import { getTenantSettings } from "@data/tenantSettings";
// automation removed
import { ensureSystemRoles } from "./roles";
import type { AdminOsDashboard, SystemHealthSnapshot } from "./adminTypes";

export async function getSystemHealth(
  tenantId: string,
): Promise<SystemHealthSnapshot> {
  await assertTenantAccess(tenantId);
  const settings = await getTenantSettings(tenantId);
  const activeRules = 0;
  const recentFailures = 0;

  const storageUsedMb = 0;
  const storageLimitMb =
    Number((settings.storage as Record<string, unknown>).max_upload_mb ?? 0) *
    1024;

  const auditAvailable = !tableMissing("audit_logs");
  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const recentAudits = auditAvailable
    ? await listAuditLogs(tenantId, { since: since24h, limit: 1000 })
    : [];

  return {
    tenantId,
    automations: {
      totalRules: 0, // automation removed
      activeRules,
      recentFailures,
    },
    storage: {
      usedMb: storageUsedMb,
      limitMb: storageLimitMb,
    },
    auditing: {
      tableAvailable: auditAvailable,
      last24hCount: recentAudits.length,
    },
    sessions: {
      activeAdmins: 0,
    },
    generatedAt: new Date().toISOString(),
  };
}

async function safeList<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch {
    return [];
  }
}

export async function getAdminOsDashboard(
  tenantId: string,
): Promise<AdminOsDashboard> {
  await assertTenantAccess(tenantId);
  await ensureSystemRoles(tenantId);
  const [tenant, settings, roles, flags, audits, health] = await Promise.all([
    getTenant(tenantId),
    getTenantSettings(tenantId),
    listRoles(tenantId, { includeSystem: true }),
    listFeatureFlags(tenantId),
    listAuditLogs(tenantId, { limit: 25 }),
    getSystemHealth(tenantId),
  ]);

  return {
    tenantId,
    tenant,
    settings,
    roleCount: roles.length,
    customRoleCount: roles.filter((r) => r.is_custom).length,
    featureFlagCount: flags.length,
    enabledFeatureFlagCount: flags.filter((f) => f.enabled).length,
    recentAuditEvents: audits,
    health,
  };
}

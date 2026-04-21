import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { listAuditLogs } from "@data/auditLogs";
import { listRoles } from "@data/roles";
import { listFeatureFlags } from "@data/featureFlags";
import { tableMissing } from "@data/_missingTable";
import { getTenant } from "@data/tenants";
import { getTenantSettings } from "@data/tenantSettings";
import { listAutomationRules } from "@data/automationRules";
import { listAutomationRuns } from "@data/automationRuns";
import { ensureSystemRoles } from "./roles";
export async function getSystemHealth(tenantId) {
    var _a;
    await assertTenantAccess(tenantId);
    const [rules, runs, settings] = await Promise.all([
        safeList(() => listAutomationRules(tenantId)),
        safeList(() => listAutomationRuns(tenantId, undefined, { limit: 200 })),
        getTenantSettings(tenantId),
    ]);
    const activeRules = rules.filter((r) => r.status === "active" ||
        r.is_active === true).length;
    const recentFailures = runs.filter((r) => r.status === "failed").length;
    const storageUsedMb = 0;
    const storageLimitMb = Number((_a = settings.storage.max_upload_mb) !== null && _a !== void 0 ? _a : 0) *
        1024;
    const auditAvailable = !tableMissing("audit_logs");
    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const recentAudits = auditAvailable
        ? await listAuditLogs(tenantId, { since: since24h, limit: 1000 })
        : [];
    return {
        tenantId,
        automations: {
            totalRules: rules.length,
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
async function safeList(fn) {
    try {
        return await fn();
    }
    catch (_a) {
        return [];
    }
}
export async function getAdminOsDashboard(tenantId) {
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

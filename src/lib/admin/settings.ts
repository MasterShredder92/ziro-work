import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import {
  getTenantSettings,
  updateTenantSettings,
  type TenantSettingsRow,
} from "@data/tenantSettings";
import {
  getTenant,
  listTenants,
  upsertTenant,
  type TenantRow,
  type UpsertTenantInput,
} from "@data/tenants";
import { recordAudit, diffObjects } from "./audit";
import type { TenantSettingsInput } from "./adminTypes";

export async function getTenantProfile(
  tenantId: string,
): Promise<TenantRow | null> {
  await assertTenantAccess(tenantId);
  return getTenant(tenantId);
}

export async function listAllTenants(): Promise<TenantRow[]> {
  return listTenants();
}

export async function updateTenantProfile(
  tenantId: string,
  input: UpsertTenantInput,
): Promise<TenantRow> {
  await assertTenantAccess(tenantId);
  const before = await getTenant(tenantId);
  const updated = await upsertTenant({ ...input, id: tenantId });
  await recordAudit({
    tenantId,
    event: "admin.tenant.updated",
    category: "admin",
    targetType: "tenant",
    targetId: tenantId,
    before: before as unknown as Record<string, unknown> | null,
    after: updated as unknown as Record<string, unknown>,
  });
  return updated;
}

export async function readSettings(
  tenantId: string,
): Promise<TenantSettingsRow> {
  await assertTenantAccess(tenantId);
  return getTenantSettings(tenantId);
}

export async function writeSettings(
  tenantId: string,
  patch: TenantSettingsInput,
): Promise<TenantSettingsRow> {
  const session = await assertTenantAccess(tenantId);
  const before = await getTenantSettings(tenantId);
  const updated = await updateTenantSettings(tenantId, {
    ...patch,
    updated_by: session.userId,
  });
  const diff = diffObjects(
    before as unknown as Record<string, unknown>,
    updated as unknown as Record<string, unknown>,
  );
  await recordAudit({
    tenantId,
    event: "admin.settings.updated",
    category: "admin",
    targetType: "tenant_settings",
    targetId: tenantId,
    before: before as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    payload: { diff },
  });
  return updated;
}

import "server-only";
import {
  deleteFeatureFlag as dbDeleteFeatureFlag,
  getFeatureFlag,
  getFeatureFlagByKey,
  listFeatureFlags,
  upsertFeatureFlag,
  type FeatureFlagRow,
} from "@data/featureFlags";
import { assertTenantAccess } from "@/lib/auth/guards";
import { recordAudit, diffObjects } from "./audit";
import type { FeatureFlagInput } from "./adminTypes";

export async function listFlags(tenantId: string): Promise<FeatureFlagRow[]> {
  await assertTenantAccess(tenantId);
  return listFeatureFlags(tenantId);
}

export async function getFlag(
  tenantId: string,
  id: string,
): Promise<FeatureFlagRow | null> {
  await assertTenantAccess(tenantId);
  return getFeatureFlag(id, tenantId);
}

export async function setFlag(
  tenantId: string,
  input: FeatureFlagInput,
): Promise<FeatureFlagRow> {
  const session = await assertTenantAccess(tenantId);
  const key = input.key.trim();
  if (!key) throw new Error("flag.key required");
  const existing =
    (input.id ? await getFeatureFlag(input.id, tenantId) : null) ??
    (await getFeatureFlagByKey(key, tenantId));
  const updated = await upsertFeatureFlag(tenantId, {
    ...input,
    id: existing?.id ?? input.id,
    created_by: existing?.created_by ?? session.userId,
    updated_by: session.userId,
  });
  await recordAudit({
    tenantId,
    event: existing ? "admin.feature_flag.updated" : "admin.feature_flag.created",
    category: "admin",
    targetType: "feature_flag",
    targetId: updated.id,
    before: (existing ?? null) as unknown as Record<string, unknown> | null,
    after: updated as unknown as Record<string, unknown>,
    payload: {
      diff: existing
        ? diffObjects(
            existing as unknown as Record<string, unknown>,
            updated as unknown as Record<string, unknown>,
          )
        : null,
    },
  });
  return updated;
}

export async function toggleFlag(
  tenantId: string,
  id: string,
  enabled: boolean,
): Promise<FeatureFlagRow> {
  const existing = await getFlag(tenantId, id);
  if (!existing) throw new Error("flag.not_found");
  return setFlag(tenantId, {
    id: existing.id,
    key: existing.key,
    enabled,
  });
}

export async function removeFlag(
  tenantId: string,
  id: string,
): Promise<void> {
  await assertTenantAccess(tenantId);
  const existing = await getFeatureFlag(id, tenantId);
  if (!existing) return;
  await dbDeleteFeatureFlag(id, tenantId);
  await recordAudit({
    tenantId,
    event: "admin.feature_flag.deleted",
    category: "admin",
    targetType: "feature_flag",
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
  });
}

export function isFlagEnabledForRole(
  flag: FeatureFlagRow,
  role: string | null | undefined,
): boolean {
  if (!flag.enabled) return false;
  if (flag.target_roles.length === 0) return true;
  if (!role) return false;
  return flag.target_roles.includes(role);
}

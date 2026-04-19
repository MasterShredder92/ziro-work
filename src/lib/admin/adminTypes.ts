/**
 * Admin OS domain types.
 *
 * These types wrap the @data row shapes into UI-friendly shapes and define
 * dashboards + request payloads used by the API and server components.
 */

import type { TenantRow } from "@data/tenants";
import type { TenantSettingsRow } from "@data/tenantSettings";
import type { RoleRow } from "@data/roles";
import type { PermissionAssignmentRow } from "@data/permissionAssignments";
import type { FeatureFlagRow } from "@data/featureFlags";
import type { AuditLogRow } from "@data/auditLogs";

export type Tenant = TenantRow;
export type TenantSettings = TenantSettingsRow;
export type RoleDefinition = RoleRow;
export type PermissionAssignment = PermissionAssignmentRow;
export type FeatureFlag = FeatureFlagRow;
export type AuditLogEntry = AuditLogRow;

export type BaseRoleKey =
  | "admin"
  | "director"
  | "teacher"
  | "student"
  | "family";

export type RoleInput = {
  id?: string;
  key?: string;
  name?: string;
  description?: string | null;
  base_role?: BaseRoleKey | null;
  is_system?: boolean;
  is_custom?: boolean;
  permissions?: string[];
  inherits_from?: string | null;
  metadata?: Record<string, unknown>;
};

export type PermissionAssignmentInput = {
  id?: string;
  profile_id: string;
  role_id?: string | null;
  permission_key: string;
  granted?: boolean;
  reason?: string | null;
  expires_at?: string | null;
};

export type TenantSettingsInput = {
  branding?: Record<string, unknown>;
  billing?: Record<string, unknown>;
  scheduling?: Record<string, unknown>;
  messaging?: Record<string, unknown>;
  automation?: Record<string, unknown>;
  forms?: Record<string, unknown>;
  storage?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type FeatureFlagInput = {
  id?: string;
  key: string;
  name?: string;
  description?: string | null;
  enabled?: boolean;
  rollout_percent?: number;
  target_roles?: string[];
  target_profile_ids?: string[];
  metadata?: Record<string, unknown>;
};

export type PermissionDiff = {
  added: string[];
  removed: string[];
  unchanged: string[];
};

export type RoleSummary = {
  role: RoleDefinition;
  effectivePermissions: string[];
  assignedProfileCount: number;
  inheritsFrom: string | null;
};

export type SystemHealthSnapshot = {
  tenantId: string;
  automations: {
    totalRules: number;
    activeRules: number;
    recentFailures: number;
  };
  storage: {
    usedMb: number;
    limitMb: number;
  };
  auditing: {
    tableAvailable: boolean;
    last24hCount: number;
  };
  sessions: {
    activeAdmins: number;
  };
  generatedAt: string;
};

export type AdminOsDashboard = {
  tenantId: string;
  tenant: Tenant | null;
  settings: TenantSettings;
  roleCount: number;
  customRoleCount: number;
  featureFlagCount: number;
  enabledFeatureFlagCount: number;
  recentAuditEvents: AuditLogEntry[];
  health: SystemHealthSnapshot;
};

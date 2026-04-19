import "server-only";
import {
  deleteRole as dbDeleteRole,
  getRole,
  listRoles,
  upsertRole,
  type RoleRow,
} from "@data/roles";
import {
  listPermissionAssignments,
  upsertPermissionAssignment,
  deletePermissionAssignment,
  type PermissionAssignmentRow,
} from "@data/permissionAssignments";
import { assertTenantAccess } from "@/lib/auth/guards";
import {
  getPermissionsForRole,
  adminPermissions,
  directorPermissions,
  teacherPermissions,
  studentPermissions,
  familyPermissions,
} from "@/lib/auth/permissions";
import { recordAudit, diffObjects, type DiffEntry } from "./audit";
import type {
  BaseRoleKey,
  PermissionAssignment,
  PermissionAssignmentInput,
  PermissionDiff,
  RoleInput,
  RoleSummary,
} from "./adminTypes";

const BASE_ROLE_KEYS: BaseRoleKey[] = [
  "admin",
  "director",
  "teacher",
  "student",
  "family",
];

function basePermsForRole(role: BaseRoleKey): string[] {
  switch (role) {
    case "admin":
      return adminPermissions;
    case "director":
      return directorPermissions;
    case "teacher":
      return teacherPermissions;
    case "student":
      return studentPermissions;
    case "family":
      return familyPermissions;
    default:
      return [];
  }
}

export async function ensureSystemRoles(tenantId: string): Promise<RoleRow[]> {
  const existing = await listRoles(tenantId, { includeSystem: true });
  const existingByKey = new Map(existing.map((r) => [r.key, r]));
  const out: RoleRow[] = [];
  for (const key of BASE_ROLE_KEYS) {
    const current = existingByKey.get(key);
    if (current) {
      out.push(current);
      continue;
    }
    const fresh = await upsertRole(tenantId, {
      key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      description: `System ${key} role`,
      base_role: key,
      is_system: true,
      is_custom: false,
      permissions: basePermsForRole(key),
    });
    out.push(fresh);
  }
  for (const row of existing) {
    if (!BASE_ROLE_KEYS.includes(row.key as BaseRoleKey)) out.push(row);
  }
  return out;
}

export async function listRolesWithSummary(
  tenantId: string,
): Promise<RoleSummary[]> {
  await assertTenantAccess(tenantId);
  const roles = await ensureSystemRoles(tenantId);
  const assignments = await listPermissionAssignments(tenantId);
  const profileCountsByRole = new Map<string, Set<string>>();
  for (const a of assignments) {
    if (!a.role_id) continue;
    const set = profileCountsByRole.get(a.role_id) ?? new Set<string>();
    set.add(a.profile_id);
    profileCountsByRole.set(a.role_id, set);
  }
  return roles.map((role) => ({
    role,
    effectivePermissions: computeEffectivePermissions(role, roles),
    assignedProfileCount: profileCountsByRole.get(role.id)?.size ?? 0,
    inheritsFrom: role.inherits_from,
  }));
}

export function computeEffectivePermissions(
  role: RoleRow,
  all: RoleRow[],
): string[] {
  const visited = new Set<string>();
  const acc = new Set<string>();
  const byId = new Map(all.map((r) => [r.id, r]));
  const byKey = new Map(all.map((r) => [r.key, r]));

  function walk(cur: RoleRow | undefined): void {
    if (!cur || visited.has(cur.id)) return;
    visited.add(cur.id);
    if (cur.base_role) {
      for (const p of basePermsForRole(cur.base_role)) acc.add(p);
    }
    for (const p of cur.permissions) acc.add(p);
    if (cur.inherits_from) {
      walk(byId.get(cur.inherits_from) ?? byKey.get(cur.inherits_from));
    }
  }

  walk(role);
  return Array.from(acc).sort();
}

export function diffPermissions(
  before: string[],
  after: string[],
): PermissionDiff {
  const b = new Set(before);
  const a = new Set(after);
  const added: string[] = [];
  const removed: string[] = [];
  const unchanged: string[] = [];
  for (const p of a) {
    if (b.has(p)) unchanged.push(p);
    else added.push(p);
  }
  for (const p of b) {
    if (!a.has(p)) removed.push(p);
  }
  return {
    added: added.sort(),
    removed: removed.sort(),
    unchanged: unchanged.sort(),
  };
}

function adminCountAfter(
  roles: RoleRow[],
  candidateId: string | null,
  candidate: RoleInput | null,
  willDelete: boolean,
): number {
  let count = 0;
  for (const r of roles) {
    if (candidateId && r.id === candidateId) {
      if (willDelete) continue;
      const base = candidate?.base_role ?? r.base_role;
      if (base === "admin") count += 1;
      continue;
    }
    if (r.base_role === "admin") count += 1;
  }
  if (!candidateId && candidate?.base_role === "admin") count += 1;
  return count;
}

export async function createRole(
  tenantId: string,
  input: RoleInput,
): Promise<RoleRow> {
  const session = await assertTenantAccess(tenantId);
  const key = (input.key ?? input.name ?? "").trim();
  if (!key) throw new Error("role.key required");
  const created = await upsertRole(tenantId, {
    key,
    name: input.name ?? key,
    description: input.description ?? null,
    base_role: input.base_role ?? null,
    is_system: false,
    is_custom: true,
    permissions: input.permissions ?? [],
    inherits_from: input.inherits_from ?? null,
    metadata: input.metadata ?? {},
    created_by: session.userId,
    updated_by: session.userId,
  });
  await recordAudit({
    tenantId,
    event: "admin.role.created",
    category: "admin",
    targetType: "role",
    targetId: created.id,
    after: created as unknown as Record<string, unknown>,
  });
  return created;
}

export async function updateRole(
  tenantId: string,
  id: string,
  input: RoleInput,
): Promise<RoleRow> {
  const session = await assertTenantAccess(tenantId);
  const existing = await getRole(id, tenantId);
  if (!existing) throw new Error("role.not_found");
  if (existing.is_system && input.base_role && input.base_role !== existing.base_role) {
    throw new Error("role.system.base_immutable");
  }

  const allRoles = await listRoles(tenantId, { includeSystem: true });
  const nextAdminCount = adminCountAfter(allRoles, id, input, false);
  if (nextAdminCount < 1) throw new Error("role.admin.lockout_prevented");

  const updated = await upsertRole(tenantId, {
    id,
    key: input.key,
    name: input.name,
    description: input.description ?? existing.description,
    base_role: input.base_role ?? existing.base_role,
    is_system: existing.is_system,
    is_custom: existing.is_custom,
    permissions: input.permissions ?? existing.permissions,
    inherits_from:
      input.inherits_from === undefined
        ? existing.inherits_from
        : input.inherits_from,
    metadata: input.metadata ?? existing.metadata,
    updated_by: session.userId,
  });

  const diff: DiffEntry[] = diffObjects(
    existing as unknown as Record<string, unknown>,
    updated as unknown as Record<string, unknown>,
  );
  await recordAudit({
    tenantId,
    event: "admin.role.updated",
    category: "admin",
    targetType: "role",
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    payload: { diff },
  });
  return updated;
}

export async function deleteRole(
  tenantId: string,
  id: string,
): Promise<void> {
  await assertTenantAccess(tenantId);
  const existing = await getRole(id, tenantId);
  if (!existing) return;
  if (existing.is_system) throw new Error("role.system.undeletable");

  const allRoles = await listRoles(tenantId, { includeSystem: true });
  const nextAdminCount = adminCountAfter(allRoles, id, null, true);
  if (nextAdminCount < 1) throw new Error("role.admin.lockout_prevented");

  await dbDeleteRole(id, tenantId);
  await recordAudit({
    tenantId,
    event: "admin.role.deleted",
    category: "admin",
    targetType: "role",
    targetId: id,
    before: existing as unknown as Record<string, unknown>,
  });
}

export async function listAssignmentsForRole(
  tenantId: string,
  roleId: string,
): Promise<PermissionAssignmentRow[]> {
  await assertTenantAccess(tenantId);
  return listPermissionAssignments(tenantId, { roleId });
}

export async function listAssignmentsForProfile(
  tenantId: string,
  profileId: string,
): Promise<PermissionAssignmentRow[]> {
  await assertTenantAccess(tenantId);
  return listPermissionAssignments(tenantId, { profileId });
}

export async function applyPermissionAssignment(
  tenantId: string,
  input: PermissionAssignmentInput,
): Promise<PermissionAssignment> {
  const session = await assertTenantAccess(tenantId);
  const created = await upsertPermissionAssignment(tenantId, {
    ...input,
    updated_by: session.userId,
    created_by: session.userId,
  });
  await recordAudit({
    tenantId,
    event: input.id
      ? "admin.permission.updated"
      : "admin.permission.created",
    category: "admin",
    targetType: "permission_assignment",
    targetId: created.id,
    after: created as unknown as Record<string, unknown>,
  });
  return created;
}

export async function revokePermissionAssignment(
  tenantId: string,
  id: string,
): Promise<void> {
  await assertTenantAccess(tenantId);
  await deletePermissionAssignment(id, tenantId);
  await recordAudit({
    tenantId,
    event: "admin.permission.revoked",
    category: "admin",
    targetType: "permission_assignment",
    targetId: id,
  });
}

export async function resolveEffectivePermissionsForProfile(
  tenantId: string,
  profileId: string,
  fallbackRoleKey: BaseRoleKey,
): Promise<string[]> {
  await assertTenantAccess(tenantId);
  const set = new Set<string>(getPermissionsForRole(fallbackRoleKey));
  const assignments = await listPermissionAssignments(tenantId, { profileId });
  for (const a of assignments) {
    if (a.granted) set.add(a.permission_key);
    else set.delete(a.permission_key);
  }
  return Array.from(set).sort();
}

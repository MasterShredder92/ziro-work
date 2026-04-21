import "server-only";
import { deleteRole as dbDeleteRole, getRole, listRoles, upsertRole, } from "@data/roles";
import { listPermissionAssignments, upsertPermissionAssignment, deletePermissionAssignment, } from "@data/permissionAssignments";
import { assertTenantAccess } from "@/lib/auth/guards";
import { getPermissionsForRole, adminPermissions, directorPermissions, teacherPermissions, studentPermissions, familyPermissions, } from "@/lib/auth/permissions";
import { recordAudit, diffObjects } from "./audit";
const BASE_ROLE_KEYS = [
    "admin",
    "director",
    "teacher",
    "student",
    "family",
];
function basePermsForRole(role) {
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
export async function ensureSystemRoles(tenantId) {
    const existing = await listRoles(tenantId, { includeSystem: true });
    const existingByKey = new Map(existing.map((r) => [r.key, r]));
    const out = [];
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
        if (!BASE_ROLE_KEYS.includes(row.key))
            out.push(row);
    }
    return out;
}
export async function listRolesWithSummary(tenantId) {
    var _a;
    await assertTenantAccess(tenantId);
    const roles = await ensureSystemRoles(tenantId);
    const assignments = await listPermissionAssignments(tenantId);
    const profileCountsByRole = new Map();
    for (const a of assignments) {
        if (!a.role_id)
            continue;
        const set = (_a = profileCountsByRole.get(a.role_id)) !== null && _a !== void 0 ? _a : new Set();
        set.add(a.profile_id);
        profileCountsByRole.set(a.role_id, set);
    }
    return roles.map((role) => {
        var _a, _b;
        return ({
            role,
            effectivePermissions: computeEffectivePermissions(role, roles),
            assignedProfileCount: (_b = (_a = profileCountsByRole.get(role.id)) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0,
            inheritsFrom: role.inherits_from,
        });
    });
}
export function computeEffectivePermissions(role, all) {
    const visited = new Set();
    const acc = new Set();
    const byId = new Map(all.map((r) => [r.id, r]));
    const byKey = new Map(all.map((r) => [r.key, r]));
    function walk(cur) {
        var _a;
        if (!cur || visited.has(cur.id))
            return;
        visited.add(cur.id);
        if (cur.base_role) {
            for (const p of basePermsForRole(cur.base_role))
                acc.add(p);
        }
        for (const p of cur.permissions)
            acc.add(p);
        if (cur.inherits_from) {
            walk((_a = byId.get(cur.inherits_from)) !== null && _a !== void 0 ? _a : byKey.get(cur.inherits_from));
        }
    }
    walk(role);
    return Array.from(acc).sort();
}
export function diffPermissions(before, after) {
    const b = new Set(before);
    const a = new Set(after);
    const added = [];
    const removed = [];
    const unchanged = [];
    for (const p of a) {
        if (b.has(p))
            unchanged.push(p);
        else
            added.push(p);
    }
    for (const p of b) {
        if (!a.has(p))
            removed.push(p);
    }
    return {
        added: added.sort(),
        removed: removed.sort(),
        unchanged: unchanged.sort(),
    };
}
function adminCountAfter(roles, candidateId, candidate, willDelete) {
    var _a;
    let count = 0;
    for (const r of roles) {
        if (candidateId && r.id === candidateId) {
            if (willDelete)
                continue;
            const base = (_a = candidate === null || candidate === void 0 ? void 0 : candidate.base_role) !== null && _a !== void 0 ? _a : r.base_role;
            if (base === "admin")
                count += 1;
            continue;
        }
        if (r.base_role === "admin")
            count += 1;
    }
    if (!candidateId && (candidate === null || candidate === void 0 ? void 0 : candidate.base_role) === "admin")
        count += 1;
    return count;
}
export async function createRole(tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const session = await assertTenantAccess(tenantId);
    const key = ((_b = (_a = input.key) !== null && _a !== void 0 ? _a : input.name) !== null && _b !== void 0 ? _b : "").trim();
    if (!key)
        throw new Error("role.key required");
    const created = await upsertRole(tenantId, {
        key,
        name: (_c = input.name) !== null && _c !== void 0 ? _c : key,
        description: (_d = input.description) !== null && _d !== void 0 ? _d : null,
        base_role: (_e = input.base_role) !== null && _e !== void 0 ? _e : null,
        is_system: false,
        is_custom: true,
        permissions: (_f = input.permissions) !== null && _f !== void 0 ? _f : [],
        inherits_from: (_g = input.inherits_from) !== null && _g !== void 0 ? _g : null,
        metadata: (_h = input.metadata) !== null && _h !== void 0 ? _h : {},
        created_by: session.userId,
        updated_by: session.userId,
    });
    await recordAudit({
        tenantId,
        event: "admin.role.created",
        category: "admin",
        targetType: "role",
        targetId: created.id,
        after: created,
    });
    return created;
}
export async function updateRole(tenantId, id, input) {
    var _a, _b, _c, _d;
    const session = await assertTenantAccess(tenantId);
    const existing = await getRole(id, tenantId);
    if (!existing)
        throw new Error("role.not_found");
    if (existing.is_system && input.base_role && input.base_role !== existing.base_role) {
        throw new Error("role.system.base_immutable");
    }
    const allRoles = await listRoles(tenantId, { includeSystem: true });
    const nextAdminCount = adminCountAfter(allRoles, id, input, false);
    if (nextAdminCount < 1)
        throw new Error("role.admin.lockout_prevented");
    const updated = await upsertRole(tenantId, {
        id,
        key: input.key,
        name: input.name,
        description: (_a = input.description) !== null && _a !== void 0 ? _a : existing.description,
        base_role: (_b = input.base_role) !== null && _b !== void 0 ? _b : existing.base_role,
        is_system: existing.is_system,
        is_custom: existing.is_custom,
        permissions: (_c = input.permissions) !== null && _c !== void 0 ? _c : existing.permissions,
        inherits_from: input.inherits_from === undefined
            ? existing.inherits_from
            : input.inherits_from,
        metadata: (_d = input.metadata) !== null && _d !== void 0 ? _d : existing.metadata,
        updated_by: session.userId,
    });
    const diff = diffObjects(existing, updated);
    await recordAudit({
        tenantId,
        event: "admin.role.updated",
        category: "admin",
        targetType: "role",
        targetId: id,
        before: existing,
        after: updated,
        payload: { diff },
    });
    return updated;
}
export async function deleteRole(tenantId, id) {
    await assertTenantAccess(tenantId);
    const existing = await getRole(id, tenantId);
    if (!existing)
        return;
    if (existing.is_system)
        throw new Error("role.system.undeletable");
    const allRoles = await listRoles(tenantId, { includeSystem: true });
    const nextAdminCount = adminCountAfter(allRoles, id, null, true);
    if (nextAdminCount < 1)
        throw new Error("role.admin.lockout_prevented");
    await dbDeleteRole(id, tenantId);
    await recordAudit({
        tenantId,
        event: "admin.role.deleted",
        category: "admin",
        targetType: "role",
        targetId: id,
        before: existing,
    });
}
export async function listAssignmentsForRole(tenantId, roleId) {
    await assertTenantAccess(tenantId);
    return listPermissionAssignments(tenantId, { roleId });
}
export async function listAssignmentsForProfile(tenantId, profileId) {
    await assertTenantAccess(tenantId);
    return listPermissionAssignments(tenantId, { profileId });
}
export async function applyPermissionAssignment(tenantId, input) {
    const session = await assertTenantAccess(tenantId);
    const created = await upsertPermissionAssignment(tenantId, Object.assign(Object.assign({}, input), { updated_by: session.userId, created_by: session.userId }));
    await recordAudit({
        tenantId,
        event: input.id
            ? "admin.permission.updated"
            : "admin.permission.created",
        category: "admin",
        targetType: "permission_assignment",
        targetId: created.id,
        after: created,
    });
    return created;
}
export async function revokePermissionAssignment(tenantId, id) {
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
export async function resolveEffectivePermissionsForProfile(tenantId, profileId, fallbackRoleKey) {
    await assertTenantAccess(tenantId);
    const set = new Set(getPermissionsForRole(fallbackRoleKey));
    const assignments = await listPermissionAssignments(tenantId, { profileId });
    for (const a of assignments) {
        if (a.granted)
            set.add(a.permission_key);
        else
            set.delete(a.permission_key);
    }
    return Array.from(set).sort();
}

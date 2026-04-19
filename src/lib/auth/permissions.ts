import type { Role } from "./roles";

const INVENTORY_ADMIN_PERMS = ["inventory.read", "inventory.write"] as const;
const INVENTORY_TEACHER_PERMS = ["inventory.read"] as const;
const LESSON_PLANNER_WRITE_PERMS = [
  "lessonPlanner.read",
  "lessonPlanner.write",
] as const;

const FILES_ADMIN_PERMS = [
  "files.read",
  "files.write",
  "files.share",
  "files.sign",
] as const;

const FILES_TEACHER_PERMS = [
  "files.read",
  "files.write",
  "files.share",
] as const;

const FILES_SHARED_READ_PERMS = ["files.read"] as const;

/** Super-scope for platform admin-only APIs (branding API, etc.). */
export const ADMIN_STAR_SCOPE = "admin.*";

const ADMIN_OS_PERMS = [
  ADMIN_STAR_SCOPE,
  "admin.read",
  "admin.write",
  "admin.roles.read",
  "admin.roles.write",
  "admin.permissions.read",
  "admin.permissions.write",
  "admin.settings.read",
  "admin.settings.write",
  "admin.feature_flags.read",
  "admin.feature_flags.write",
  "admin.audit.read",
  "admin.system_health.read",
  "admin.branding.read",
  "admin.branding.write",
] as const;

const DIRECTOR_ADMIN_PERMS = [
  "admin.read",
  "admin.roles.read",
  "admin.permissions.read",
  "admin.settings.read",
  "admin.feature_flags.read",
  "admin.audit.read",
  "admin.system_health.read",
  "admin.branding.read",
] as const;

export const adminPermissions: string[] = [
  ...ADMIN_OS_PERMS,
  "crm.read",
  "crm.write",
  "leads.read",
  "leads.write",
  "students.read",
  "students.write",
  "schedule.read",
  "schedule.write",
  "scheduling.read",
  "scheduling.write",
  "billing.read",
  "billing.write",
  "messages.read",
  "messages.write",
  "messages.admin",
  "locations.read",
  "locations.write",
  "director.read",
  "teacher.read",
  "family.read",
  "student.read",
  "automation.read",
  "automation.write",
  "forms.read",
  "forms.write",
  "templates.read",
  "templates.write",
  "curriculum.read",
  "curriculum.write",
  "progress.read",
  "progress.write",
  "reports.read",
  "reports.write",
  "assessments.read",
  "assessments.write",
  "assessments.run",
  "content.read",
  "content.write",
  "attendance.read",
  "attendance.write",
  ...INVENTORY_ADMIN_PERMS,
  ...LESSON_PLANNER_WRITE_PERMS,
  ...FILES_ADMIN_PERMS,
];

export const directorPermissions: string[] = [
  ...DIRECTOR_ADMIN_PERMS,
  "crm.read",
  "crm.write",
  "leads.read",
  "leads.write",
  "students.read",
  "students.write",
  "schedule.read",
  "schedule.write",
  "scheduling.read",
  "scheduling.write",
  "billing.read",
  "billing.write",
  "messages.read",
  "messages.write",
  "locations.read",
  "locations.write",
  "director.read",
  "teacher.read",
  "family.read",
  "student.read",
  "automation.read",
  "automation.write",
  "forms.read",
  "forms.write",
  "templates.read",
  "templates.write",
  "curriculum.read",
  "curriculum.write",
  "progress.read",
  "progress.write",
  "reports.read",
  "reports.write",
  "assessments.read",
  "assessments.write",
  "assessments.run",
  "content.read",
  "content.write",
  "attendance.read",
  "attendance.write",
  ...INVENTORY_ADMIN_PERMS,
  ...LESSON_PLANNER_WRITE_PERMS,
  ...FILES_ADMIN_PERMS,
];

export const teacherPermissions: string[] = [
  "crm.read",
  "students.read",
  "schedule.read",
  "schedule.write",
  "messages.read",
  "messages.write",
  "curriculum.read",
  "progress.read",
  "progress.write",
  "teacher.read",
  "student.read",
  "assessments.read",
  "assessments.write",
  "assessments.run",
  "content.read",
  "content.write",
  "attendance.read",
  "attendance.write",
  "automation.read",
  "reports.read",
  ...INVENTORY_TEACHER_PERMS,
  ...LESSON_PLANNER_WRITE_PERMS,
  ...FILES_TEACHER_PERMS,
];

export const familyPermissions: string[] = [
  "crm.read",
  "students.read",
  "schedule.read",
  "billing.read",
  "messages.read",
  "messages.write",
  "family.read",
  "student.read",
  "assessments.read",
  "assessments.view",
  ...FILES_SHARED_READ_PERMS,
];

export const studentPermissions: string[] = [
  "crm.read",
  "schedule.read",
  "messages.read",
  "billing.read",
  "student.read",
  "assessments.read",
  "assessments.run",
  "content.read",
  ...FILES_SHARED_READ_PERMS,
];

const rolePermissions: Record<Role, string[]> = {
  admin: adminPermissions,
  director: directorPermissions,
  teacher: teacherPermissions,
  family: familyPermissions,
  student: studentPermissions,
};

export function getPermissionsForRole(role: Role): string[] {
  return rolePermissions[role] ?? [];
}

export function hasPermission(role: Role, scope: string): boolean {
  const perms = getPermissionsForRole(role);
  if (perms.includes(scope)) return true;
  if (
    perms.includes(ADMIN_STAR_SCOPE) &&
    scope.startsWith("admin.") &&
    scope !== ADMIN_STAR_SCOPE
  ) {
    return true;
  }
  return false;
}

export function can(role: Role, permission: string): boolean;
export function can(permission: string): Promise<boolean>;
export function can(
  a: Role | string,
  b?: string,
): boolean | Promise<boolean> {
  if (typeof b === "string") {
    const role = a as Role;
    return hasPermission(role, b);
  }
  const permission = a as string;
  return (async () => {
    if (!permission) return false;
    const { getSession } = await loadSessionModule();
    const session = await getSession();
    if (!session) return false;
    return hasPermission(session.role, permission);
  })();
}

export function canForRole(role: Role | null | undefined, permission: string): boolean {
  if (!role || !permission) return false;
  return hasPermission(role, permission);
}

export async function canAny(permissions: string[]): Promise<boolean> {
  if (!permissions || permissions.length === 0) return false;
  const { getSession } = await loadSessionModule();
  const session = await getSession();
  if (!session) return false;
  for (const p of permissions) {
    if (hasPermission(session.role, p)) return true;
  }
  return false;
}

export async function canAll(permissions: string[]): Promise<boolean> {
  if (!permissions || permissions.length === 0) return false;
  const { getSession } = await loadSessionModule();
  const session = await getSession();
  if (!session) return false;
  for (const p of permissions) {
    if (!hasPermission(session.role, p)) return false;
  }
  return true;
}

function loadSessionModule(): Promise<typeof import("./session")> {
  const dynamicImporter = new Function(
    'return import("./session")',
  ) as () => Promise<typeof import("./session")>;
  return dynamicImporter();
}

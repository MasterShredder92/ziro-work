export const roles = ["admin", "director", "teacher", "family", "student"] as const;

export type Role = (typeof roles)[number];

export const roleHierarchy: Record<Role, number> = {
  admin: 5,
  director: 4,
  teacher: 3,
  family: 2,
  student: 1,
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (roles as readonly string[]).includes(value);
}

export function compareRoles(a: Role, b: Role): number {
  return roleHierarchy[a] - roleHierarchy[b];
}

export function roleAtLeast(actual: Role, required: Role): boolean {
  return roleHierarchy[actual] >= roleHierarchy[required];
}

export function normalizeDbRole(value: string | null | undefined): Role | null {
  if (!value) return null;
  switch (value) {
    case "owner":
    case "admin":
      return "admin";
    case "company_director":
    case "studio_director":
    case "director":
      return "director";
    case "teacher":
      return "teacher";
    case "parent":
    case "family":
      return "family";
    case "student":
      return "student";
    default:
      return null;
  }
}

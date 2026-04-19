/**
 * Permission bundles: grouped permissions by domain for UIs and role editing.
 * Extend this list whenever a new OS ships permissions.
 */

export type PermissionBundle = {
  key: string;
  label: string;
  description?: string;
  permissions: string[];
};

export const PERMISSION_BUNDLES: PermissionBundle[] = [
  {
    key: "admin",
    label: "Admin OS",
    description: "Tenant administration, roles, permissions, settings.",
    permissions: [
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
    ],
  },
  {
    key: "leads",
    label: "Leads",
    permissions: ["leads.read", "leads.write"],
  },
  {
    key: "students",
    label: "Students",
    permissions: ["students.read", "students.write", "student.read"],
  },
  {
    key: "scheduling",
    label: "Scheduling",
    permissions: [
      "schedule.read",
      "schedule.write",
      "scheduling.read",
      "scheduling.write",
    ],
  },
  {
    key: "billing",
    label: "Billing",
    permissions: ["billing.read", "billing.write"],
  },
  {
    key: "messaging",
    label: "Messaging",
    permissions: ["messages.read", "messages.write"],
  },
  {
    key: "locations",
    label: "Locations",
    permissions: ["locations.read", "locations.write"],
  },
  {
    key: "automation",
    label: "Automation",
    permissions: ["automation.read", "automation.write"],
  },
  {
    key: "forms",
    label: "Forms & Surveys",
    permissions: ["forms.read", "forms.write"],
  },
  {
    key: "templates",
    label: "Templates",
    permissions: ["templates.read", "templates.write"],
  },
  {
    key: "curriculum",
    label: "Curriculum",
    permissions: ["curriculum.read", "curriculum.write"],
  },
  {
    key: "progress",
    label: "Student Progress",
    permissions: ["progress.read", "progress.write"],
  },
  {
    key: "reports",
    label: "Reports",
    permissions: ["reports.read"],
  },
  {
    key: "assessments",
    label: "Assessments",
    permissions: [
      "assessments.read",
      "assessments.write",
      "assessments.run",
      "assessments.view",
    ],
  },
  {
    key: "content",
    label: "Content Library",
    permissions: ["content.read", "content.write"],
  },
  {
    key: "attendance",
    label: "Attendance",
    permissions: ["attendance.read", "attendance.write"],
  },
  {
    key: "inventory",
    label: "Inventory",
    permissions: ["inventory.read", "inventory.write"],
  },
  {
    key: "lesson_planner",
    label: "Lesson Planner",
    permissions: ["lessonPlanner.read", "lessonPlanner.write"],
  },
  {
    key: "director",
    label: "Director surface",
    permissions: ["director.read"],
  },
  {
    key: "teacher",
    label: "Teacher surface",
    permissions: ["teacher.read"],
  },
  {
    key: "family",
    label: "Family surface",
    permissions: ["family.read"],
  },
];

export const ALL_PERMISSION_KEYS: string[] = Array.from(
  new Set(PERMISSION_BUNDLES.flatMap((b) => b.permissions)),
).sort();

export function getBundle(key: string): PermissionBundle | null {
  return PERMISSION_BUNDLES.find((b) => b.key === key) ?? null;
}

export function bundleForPermission(
  permission: string,
): PermissionBundle | null {
  return (
    PERMISSION_BUNDLES.find((b) => b.permissions.includes(permission)) ?? null
  );
}

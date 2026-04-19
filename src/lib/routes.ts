export type RouteGroupId = "top" | "lifecycle" | "ops";

export type AppRoute = {
  id: string;
  label: string;
  href: `/${string}`;
  group: RouteGroupId;
};

export type AppRouteGroup = {
  id: RouteGroupId;
  label: string;
  items: AppRoute[];
};

export const ROUTE_GROUPS: AppRouteGroup[] = [
  {
    id: "top",
    label: "TOP",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", group: "top" },
      { id: "studio-map", label: "Studio Map", href: "/studio-map", group: "top" },
      { id: "schedule", label: "Schedule", href: "/schedule", group: "top" },
    ],
  },
  {
    id: "lifecycle",
    label: "CUSTOMER LIFECYCLE",
    items: [
      { id: "intake", label: "Inquiries", href: "/lifecycle/intake", group: "lifecycle" },
      { id: "lead-work", label: "Follow-up", href: "/lifecycle/lead-work", group: "lifecycle" },
      { id: "scheduling", label: "Scheduling", href: "/lifecycle/scheduling", group: "lifecycle" },
      { id: "enrollment", label: "Enrollment", href: "/lifecycle/enrollment", group: "lifecycle" },
      { id: "service-delivery", label: "Ongoing lessons", href: "/lifecycle/service-delivery", group: "lifecycle" },
      { id: "relationship", label: "Client care", href: "/lifecycle/relationship", group: "lifecycle" },
      { id: "retention", label: "Retention", href: "/lifecycle/retention", group: "lifecycle" },
      { id: "win-back", label: "Invite them back", href: "/lifecycle/win-back", group: "lifecycle" },
    ],
  },
  {
    id: "ops",
    label: "STUDIO OPERATIONS",
    items: [
      { id: "families", label: "Families / Accounts", href: "/families", group: "ops" },
      { id: "students", label: "Students", href: "/students", group: "ops" },
      { id: "attendance", label: "Attendance", href: "/attendance", group: "ops" },
      { id: "teachers", label: "Teachers", href: "/teachers", group: "ops" },
      { id: "invoices", label: "Invoices", href: "/invoices", group: "ops" },
      { id: "payroll", label: "Payroll", href: "/payroll", group: "ops" },
      { id: "recruitment", label: "Recruitment", href: "/recruitment", group: "ops" },
      { id: "reports", label: "Reports / Books", href: "/reports", group: "ops" },
      { id: "settings", label: "Settings", href: "/settings", group: "ops" },
    ],
  },
];

export const ALL_ROUTES: AppRoute[] = ROUTE_GROUPS.flatMap((g) => g.items);

export function getRouteByHref(href: string): AppRoute | undefined {
  return ALL_ROUTES.find((r) => r.href === href);
}


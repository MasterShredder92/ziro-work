export const ROUTE_GROUPS = [
    {
        id: "core",
        label: "CORE",
        items: [
            { id: "dashboard", label: "Dashboard", href: "/dashboard", group: "core" },
            { id: "schedule", label: "Schedule", href: "/schedule", group: "core" },
            { id: "studio-map", label: "Studio Map", href: "/studio-map", group: "core" },
        ],
    },
    {
        id: "people",
        label: "PEOPLE",
        items: [
            { id: "crm", label: "Families & Students", href: "/crm", group: "people" },
            { id: "teachers", label: "Teachers", href: "/teachers", group: "people" },
        ],
    },
    {
        id: "money",
        label: "MONEY",
        items: [
            { id: "invoices", label: "Invoices", href: "/invoices", group: "money" },
            { id: "payroll", label: "Payroll", href: "/payroll", group: "money" },
            { id: "financials", label: "Financials", href: "/financials", group: "money" },
        ],
    },
    {
        id: "growth",
        label: "GROWTH",
        items: [
            { id: "lifecycle", label: "Student Journey", href: "/lifecycle", group: "growth" },
            { id: "agent-reports", label: "Agent Reports", href: "/agent-reports", group: "growth" },
            { id: "recruitment", label: "Recruitment", href: "/recruitment", group: "growth" },
        ],
    },
    {
        id: "admin",
        label: "ADMIN",
        items: [
            { id: "settings", label: "Settings", href: "/settings", group: "admin" },
        ],
    },
];
export const ALL_ROUTES = ROUTE_GROUPS.flatMap((g) => g.items);
export function getRouteByHref(href) {
    return ALL_ROUTES.find((r) => r.href === href);
}

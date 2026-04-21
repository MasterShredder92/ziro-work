import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
const demos = [
    { href: "/sandbox/button", label: "Button" },
    { href: "/sandbox/badge", label: "Badge" },
    { href: "/sandbox/table", label: "Table" },
    { href: "/sandbox/list", label: "List" },
    { href: "/sandbox/modal", label: "Modal" },
    { href: "/sandbox/drawer", label: "Drawer" },
    { href: "/sandbox/tabs", label: "Tabs" },
    { href: "/sandbox/studio-map", label: "Studio Map" },
    { href: "/sandbox/teacher", label: "Teacher" },
    { href: "/sandbox/settings", label: "Settings" },
    { href: "/sandbox/docs", label: "Docs" },
    { href: "/sandbox/changelog", label: "Changelog" },
];
export default function SandboxIndexPage() {
    return (_jsxs("div", { className: "space-y-[var(--z-space-6)]", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-extrabold", children: "UI Sandbox" }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Visual QA pages for reusable UI components (not linked in the app sidebar)." })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-[var(--z-space-4)]", children: demos.map((d) => (_jsxs(Link, { href: d.href, className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-[var(--z-space-5)] py-[var(--z-space-4)] hover:border-[var(--z-border-2)] hover:bg-[color-mix(in_oklab,var(--z-surface),white_4%)] transition-colors", children: [_jsx("div", { className: "text-sm font-extrabold", children: d.label }), _jsx("div", { className: "mt-1 text-xs text-[var(--z-muted)]", children: d.href })] }, d.href))) })] }));
}

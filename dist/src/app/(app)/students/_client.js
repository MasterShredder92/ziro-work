"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStudents } from "@/hooks/data/useStudents";
import { useTenantUi } from "@/components/tenant/TenantUiContext";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
const PAGE = { mode: "offset", page: 1, pageSize: 500 };
export function StudentsClient() {
    var _a, _b, _c, _d, _e;
    const { tenantId, locationId, currentLocation } = useTenantUi();
    const studentsQuery = useStudents({
        tenantId,
        page: PAGE,
        locationId: locationId || undefined,
    }, { enabled: Boolean(tenantId) });
    const count = (_c = (_b = (_a = studentsQuery.data) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
    const items = (_e = (_d = studentsQuery.data) === null || _d === void 0 ? void 0 : _d.items) !== null && _e !== void 0 ? _e : [];
    return (_jsx(PageShell, { title: "Students", children: _jsxs("div", { className: "mx-auto max-w-5xl space-y-[var(--z-space-6)]", children: [_jsx(AgentPageBar, { agentId: "sid", chatPlaceholder: "Ask Sid about any student\u2026", pageContext: { page: "students", count } }), _jsx(PageHeader, { title: "Students", subtitle: currentLocation
                        ? `Roster scoped to ${currentLocation.name} (includes rows with no location).`
                        : "All locations for this tenant (no location picker yet)." }), studentsQuery.error ? (_jsx("p", { className: "text-sm text-[var(--z-danger)]", children: studentsQuery.error.message })) : (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: studentsQuery.isLoading ? "Loading roster…" : `${count} students loaded for this tenant.` })), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: ["For sorting, bulk actions, and inline edits use", " ", _jsx(Link, { className: "text-[var(--z-accent)] hover:underline", href: "/crm/students", children: "CRM \u2192 Students" }), "."] }), !studentsQuery.isLoading && !studentsQuery.error && items.length > 0 ? (_jsx("ul", { className: "divide-y divide-[var(--z-border,#1c1c1e)] overflow-hidden rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)]", children: items.map((row) => {
                        var _a, _b;
                        const r = row;
                        const name = `${(_a = r.first_name) !== null && _a !== void 0 ? _a : ""} ${(_b = r.last_name) !== null && _b !== void 0 ? _b : ""}`.trim() || "Unnamed student";
                        return (_jsx("li", { className: "flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm", children: _jsxs("div", { className: "min-w-0", children: [_jsx(Link, { href: `/crm/students/${encodeURIComponent(r.id)}`, className: "font-medium text-[var(--z-accent,#00ff88)] hover:underline", children: name }), r.status ? (_jsx("span", { className: "ml-2 text-xs text-[var(--z-muted,#909098)]", children: r.status })) : null] }) }, r.id));
                    }) })) : null] }) }));
}

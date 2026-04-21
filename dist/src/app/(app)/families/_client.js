"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { useFamilies } from "@/hooks/data/useFamilies";
import { useTenantUi } from "@/components/tenant/TenantUiContext";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
const PAGE = { mode: "offset", page: 1, pageSize: 500 };
export function FamiliesClient() {
    var _a, _b, _c, _d, _e;
    const { tenantId, locationId, currentLocation } = useTenantUi();
    const familiesQuery = useFamilies({
        tenantId,
        page: PAGE,
        locationId: locationId || undefined,
    }, { enabled: Boolean(tenantId) });
    const count = (_c = (_b = (_a = familiesQuery.data) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
    const items = (_e = (_d = familiesQuery.data) === null || _d === void 0 ? void 0 : _d.items) !== null && _e !== void 0 ? _e : [];
    return (_jsx(PageShell, { title: "Families / Accounts", children: _jsxs("div", { className: "mx-auto max-w-5xl space-y-[var(--z-space-6)]", children: [_jsx(AgentPageBar, { agentId: "sid", chatPlaceholder: "Ask Sid about this family\u2026", pageContext: { page: "families", count } }), _jsx(PageHeader, { title: "Families / Accounts", subtitle: currentLocation
                        ? `Accounts prioritized for ${currentLocation.name} (includes accounts with no primary location).`
                        : "All locations for this tenant." }), familiesQuery.error ? (_jsx("p", { className: "text-sm text-[var(--z-danger)]", children: familiesQuery.error.message })) : (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: familiesQuery.isLoading
                        ? "Loading accounts…"
                        : `${count} family accounts${currentLocation ? ` for ${currentLocation.name}` : " (all locations for this tenant)"}.` })), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: ["Full table and billing context:", " ", _jsx(Link, { className: "text-[var(--z-accent)] hover:underline", href: "/crm/families", children: "CRM \u2192 Families" }), "."] }), !familiesQuery.isLoading && !familiesQuery.error && items.length > 0 ? (_jsx("ul", { className: "divide-y divide-[var(--z-border,#1c1c1e)] overflow-hidden rounded-lg border border-[var(--z-border,#1c1c1e)] bg-[var(--z-surface,#0a0a0c)]", children: items.map((row) => {
                        var _a;
                        const r = row;
                        const label = ((_a = r.name) !== null && _a !== void 0 ? _a : "").trim() || "Unnamed account";
                        return (_jsx("li", { className: "flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm", children: _jsxs("div", { className: "min-w-0", children: [_jsx(Link, { href: `/crm/families/${encodeURIComponent(r.id)}`, className: "font-medium text-[var(--z-accent,#00ff88)] hover:underline", children: label }), r.primary_email ? (_jsx("span", { className: "ml-2 truncate text-xs text-[var(--z-muted,#909098)]", children: r.primary_email })) : null] }) }, r.id));
                    }) })) : null] }) }));
}

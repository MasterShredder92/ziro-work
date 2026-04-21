"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState, useTransition } from "react";
import { PortalLayoutPreview } from "./PortalLayoutPreview";
const SCOPES = ["student", "family", "teacher", "director", "admin"];
const PRESETS = ["classic", "compact", "minimal"];
const SIDEBARS = ["icons_only", "icons_labels", "collapsible"];
const DASHBOARDS = ["grid", "focus", "feed"];
function toDraftMap(layouts) {
    const map = {
        student: {},
        family: {},
        teacher: {},
        director: {},
        admin: {},
    };
    for (const l of layouts) {
        map[l.scope] = l;
    }
    return map;
}
export function PortalLayoutForm({ tenantId, layouts, canWrite, }) {
    const [draftMap, setDraftMap] = useState(() => toDraftMap(layouts));
    const [activeScope, setActiveScope] = useState("teacher");
    const [error, setError] = useState(null);
    const [savedAt, setSavedAt] = useState(null);
    const [isPending, startTransition] = useTransition();
    const active = useMemo(() => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const d = draftMap[activeScope];
        return {
            id: (_a = d.id) !== null && _a !== void 0 ? _a : `preview-${activeScope}`,
            tenant_id: tenantId,
            scope: activeScope,
            preset: ((_b = d.preset) !== null && _b !== void 0 ? _b : "classic"),
            sidebar_variant: ((_c = d.sidebar_variant) !== null && _c !== void 0 ? _c : "icons_labels"),
            dashboard_preset: ((_d = d.dashboard_preset) !== null && _d !== void 0 ? _d : "grid"),
            widgets: (_e = d.widgets) !== null && _e !== void 0 ? _e : [
                { id: "a", title: "Widget A", size: "md" },
                { id: "b", title: "Widget B", size: "md" },
                { id: "c", title: "Widget C", size: "lg" },
                { id: "d", title: "Widget D", size: "sm" },
            ],
            header_extras: (_f = d.header_extras) !== null && _f !== void 0 ? _f : [],
            footer_extras: (_g = d.footer_extras) !== null && _g !== void 0 ? _g : [],
            created_at: (_h = d.created_at) !== null && _h !== void 0 ? _h : new Date().toISOString(),
            updated_at: (_j = d.updated_at) !== null && _j !== void 0 ? _j : new Date().toISOString(),
        };
    }, [draftMap, activeScope, tenantId]);
    const updateActive = (patch) => {
        setDraftMap((m) => (Object.assign(Object.assign({}, m), { [activeScope]: Object.assign(Object.assign(Object.assign({}, m[activeScope]), patch), { scope: activeScope }) })));
    };
    const save = () => {
        if (!canWrite)
            return;
        setError(null);
        startTransition(async () => {
            var _a, _b;
            try {
                const res = await fetch(`/api/branding/layout?tenantId=${encodeURIComponent(tenantId)}`, {
                    method: "PATCH",
                    headers: {
                        "content-type": "application/json",
                        "x-tenant-id": tenantId,
                    },
                    body: JSON.stringify({
                        layout: {
                            scope: activeScope,
                            preset: active.preset,
                            sidebar_variant: active.sidebar_variant,
                            dashboard_preset: active.dashboard_preset,
                            widgets: active.widgets,
                            header_extras: active.header_extras,
                            footer_extras: active.footer_extras,
                        },
                    }),
                });
                const json = (await res.json().catch(() => null));
                if (!res.ok) {
                    setError((_a = json === null || json === void 0 ? void 0 : json.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                    return;
                }
                const row = (_b = json === null || json === void 0 ? void 0 : json.data) === null || _b === void 0 ? void 0 : _b.layout;
                if (row) {
                    setDraftMap((m) => (Object.assign(Object.assign({}, m), { [activeScope]: row })));
                }
                setSavedAt(new Date().toISOString());
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
            }
        });
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("header", { className: "flex flex-col sm:flex-row sm:items-center gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Portal layouts" }), _jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Presets, sidebars & dashboard widgets" })] }), _jsxs("div", { className: "sm:ml-auto flex items-center gap-2", children: [savedAt ? (_jsxs("span", { className: "text-[11px] text-[var(--z-muted)]", children: ["Saved ", new Date(savedAt).toLocaleTimeString()] })) : null, _jsx("button", { type: "button", onClick: save, disabled: !canWrite || isPending, className: "h-9 rounded-[var(--z-radius-sm)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50", children: isPending ? "Saving…" : "Save layout" })] })] }), error ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 px-3 py-2 text-xs text-[#ff3b6b]", children: error })) : null, _jsx("nav", { className: "flex flex-wrap gap-2", children: SCOPES.map((s) => (_jsx("button", { type: "button", onClick: () => setActiveScope(s), className: `h-8 rounded-[var(--z-radius-sm)] border px-3 text-xs capitalize ${activeScope === s
                        ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88] font-semibold"
                        : "border-[var(--z-border)] bg-[var(--z-surface)] text-[var(--z-muted)] hover:text-[var(--z-fg)]"}`, children: s }, s))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [_jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Preset" }), _jsx("div", { className: "flex gap-2 mt-1", children: PRESETS.map((p) => (_jsx("button", { type: "button", onClick: () => updateActive({ preset: p }), disabled: !canWrite, className: `h-8 rounded-[var(--z-radius-sm)] border px-3 text-xs capitalize ${active.preset === p
                                                ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88] font-semibold"
                                                : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] hover:text-[var(--z-fg)]"}`, children: p }, p))) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Sidebar" }), _jsx("div", { className: "flex flex-wrap gap-2 mt-1", children: SIDEBARS.map((p) => (_jsx("button", { type: "button", onClick: () => updateActive({ sidebar_variant: p }), disabled: !canWrite, className: `h-8 rounded-[var(--z-radius-sm)] border px-3 text-xs ${active.sidebar_variant === p
                                                ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88] font-semibold"
                                                : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] hover:text-[var(--z-fg)]"}`, children: p.replace("_", " ") }, p))) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Dashboard" }), _jsx("div", { className: "flex gap-2 mt-1", children: DASHBOARDS.map((p) => (_jsx("button", { type: "button", onClick: () => updateActive({ dashboard_preset: p }), disabled: !canWrite, className: `h-8 rounded-[var(--z-radius-sm)] border px-3 text-xs capitalize ${active.dashboard_preset === p
                                                ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88] font-semibold"
                                                : "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)] hover:text-[var(--z-fg)]"}`, children: p }, p))) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Widgets" }), _jsx("div", { className: "flex flex-col gap-1 mt-1", children: active.widgets.map((w, i) => (_jsxs("div", { className: "flex items-center gap-2 text-xs text-[var(--z-fg)]", children: [_jsx("span", { className: "inline-flex w-6 justify-center rounded border border-[var(--z-border)] bg-[var(--z-surface-2)] px-1 text-[10px] uppercase", children: w.size }), _jsx("span", { className: "truncate", children: w.title })] }, `${w.id}-${i}`))) })] })] }), _jsx("section", { children: _jsx(PortalLayoutPreview, { layout: active, scopeLabel: `${activeScope} portal` }) })] })] }));
}

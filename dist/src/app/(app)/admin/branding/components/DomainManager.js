"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useTransition } from "react";
import { DomainStatusBadge } from "./DomainStatusBadge";
export function DomainManager({ tenantId, domains, canWrite, }) {
    const [list, setList] = useState(domains);
    const [newDomain, setNewDomain] = useState("");
    const [error, setError] = useState(null);
    const [isPending, startTransition] = useTransition();
    const addDomain = () => {
        if (!canWrite || !newDomain.trim())
            return;
        setError(null);
        startTransition(async () => {
            var _a, _b;
            try {
                const res = await fetch("/api/branding/domain", {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        "x-tenant-id": tenantId,
                    },
                    body: JSON.stringify({ tenantId, domain_name: newDomain.trim() }),
                });
                const json = (await res.json().catch(() => null));
                if (!res.ok) {
                    setError((_a = json === null || json === void 0 ? void 0 : json.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                    return;
                }
                const row = (_b = json === null || json === void 0 ? void 0 : json.data) === null || _b === void 0 ? void 0 : _b.domain;
                if (row) {
                    setList((arr) => {
                        const next = arr.filter((d) => d.id !== row.id);
                        next.unshift(row);
                        return next;
                    });
                    setNewDomain("");
                }
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
            }
        });
    };
    const act = (domain, action) => {
        if (!canWrite)
            return;
        setError(null);
        startTransition(async () => {
            var _a, _b;
            try {
                const res = await fetch("/api/branding/domain", {
                    method: action === "delete" ? "DELETE" : "PATCH",
                    headers: {
                        "content-type": "application/json",
                        "x-tenant-id": tenantId,
                    },
                    body: JSON.stringify(action === "delete"
                        ? { id: domain.id }
                        : {
                            id: domain.id,
                            action: action === "activate" ? "activate" : "verify",
                        }),
                });
                const json = (await res.json().catch(() => null));
                if (!res.ok) {
                    setError((_a = json === null || json === void 0 ? void 0 : json.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                    return;
                }
                if (action === "delete") {
                    setList((arr) => arr.filter((d) => d.id !== domain.id));
                }
                else if ((_b = json === null || json === void 0 ? void 0 : json.data) === null || _b === void 0 ? void 0 : _b.domain) {
                    const next = json.data.domain;
                    setList((arr) => arr.map((d) => (d.id === next.id ? next : d)));
                }
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "Failed");
            }
        });
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Domain manager" }), _jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: "Custom domains & CNAME verification" })] }), error ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 px-3 py-2 text-xs text-[#ff3b6b]", children: error })) : null, _jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", children: [_jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Add domain" }), _jsxs("div", { className: "flex flex-col md:flex-row items-stretch gap-2", children: [_jsx("input", { type: "text", placeholder: "school.example.com", value: newDomain, onChange: (e) => setNewDomain(e.target.value), disabled: !canWrite || isPending, className: "h-9 flex-1 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)] font-mono" }), _jsx("button", { type: "button", onClick: addDomain, disabled: !canWrite || isPending, className: "h-9 rounded-[var(--z-radius-sm)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50", children: isPending ? "Adding…" : "Add domain" })] }), _jsxs("div", { className: "text-[11px] text-[var(--z-muted)]", children: ["After adding, create a CNAME record pointing to", " ", _jsx("span", { className: "font-mono", children: "cname.ziro.work" }), " and click Verify."] })] }), _jsxs("section", { className: "space-y-3", children: [list.length === 0 ? (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-xs text-[var(--z-muted)]", children: "No domains yet. Add one above." })) : null, list.map((d) => {
                        var _a;
                        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-2", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center gap-2", children: [_jsx("div", { className: "font-mono text-sm text-[var(--z-fg)] truncate", children: d.domain_name }), _jsxs("div", { className: "sm:ml-auto flex items-center gap-2", children: [_jsx(DomainStatusBadge, { status: d.status }), d.is_primary ? (_jsx("span", { className: "text-[10px] uppercase tracking-wider text-[#00ff88] border border-[#00ff88]/40 rounded px-1.5 py-0.5", children: "Primary" })) : null] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-[var(--z-muted)]", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[var(--z-fg)] font-mono", children: "CNAME \u2192 " }), _jsx("span", { className: "font-mono", children: (_a = d.verification_target) !== null && _a !== void 0 ? _a : "cname.ziro.work" })] }), _jsxs("div", { children: [_jsx("span", { className: "text-[var(--z-fg)]", children: "Token: " }), _jsx("span", { className: "font-mono", children: d.verification_token })] }), d.verified_at ? (_jsxs("div", { children: ["Verified at ", new Date(d.verified_at).toLocaleString()] })) : null, d.last_checked_at ? (_jsxs("div", { children: ["Last checked ", new Date(d.last_checked_at).toLocaleString()] })) : null, d.failure_reason ? (_jsx("div", { className: "text-[#ff3b6b]", children: d.failure_reason })) : null] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("button", { type: "button", onClick: () => act(d, "verify"), disabled: !canWrite || isPending || d.status === "verified" || d.status === "active", className: "h-8 rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 text-xs text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50", children: "Verify" }), _jsx("button", { type: "button", onClick: () => act(d, "activate"), disabled: !canWrite ||
                                                isPending ||
                                                (d.status !== "verified" && d.status !== "active"), className: "h-8 rounded-[var(--z-radius-sm)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50", children: d.status === "active" ? "Active" : "Activate" }), _jsx("button", { type: "button", onClick: () => act(d, "delete"), disabled: !canWrite || isPending, className: "h-8 rounded-[var(--z-radius-sm)] border border-[#ff3b6b]/40 bg-[#ff3b6b]/10 px-3 text-xs text-[#ff3b6b] hover:bg-[#ff3b6b]/20 disabled:opacity-50", children: "Remove" })] })] }, d.id));
                    })] })] }));
}

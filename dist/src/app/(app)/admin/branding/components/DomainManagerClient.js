"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { DNSStatusPanel } from "@/components/branding/DNSStatusPanel";
import { DomainStatusBadge } from "./DomainStatusBadge";
export function DomainManagerClient({ tenantId, canWrite, domains: initial, }) {
    var _a, _b, _c, _d;
    const [domains, setDomains] = useState(initial);
    const [name, setName] = useState("");
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);
    const qs = useMemo(() => `tenantId=${encodeURIComponent(tenantId)}`, [tenantId]);
    async function addDomain() {
        var _a, _b;
        if (!canWrite || !name.trim())
            return;
        setBusy(true);
        setMsg(null);
        try {
            const res = await fetch(`/api/branding/domain?${qs}`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ domain_name: name.trim() }),
            });
            const j = (await res.json().catch(() => null));
            if (!res.ok) {
                setMsg((_a = j === null || j === void 0 ? void 0 : j.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                return;
            }
            if ((_b = j === null || j === void 0 ? void 0 : j.data) === null || _b === void 0 ? void 0 : _b.domain)
                setDomains((d) => [...d, j.data.domain]);
            setName("");
            setMsg("Domain added.");
        }
        finally {
            setBusy(false);
        }
    }
    async function verify(id, action) {
        var _a, _b;
        if (!canWrite)
            return;
        setBusy(true);
        setMsg(null);
        try {
            const res = await fetch(`/api/branding/domain?${qs}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id, action }),
            });
            const j = (await res.json().catch(() => null));
            if (!res.ok) {
                setMsg((_a = j === null || j === void 0 ? void 0 : j.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                return;
            }
            if ((_b = j === null || j === void 0 ? void 0 : j.data) === null || _b === void 0 ? void 0 : _b.domain) {
                setDomains((list) => list.map((x) => (x.id === id ? j.data.domain : x)));
            }
            setMsg("Updated.");
        }
        finally {
            setBusy(false);
        }
    }
    async function remove(id) {
        var _a;
        if (!canWrite)
            return;
        setBusy(true);
        setMsg(null);
        try {
            const res = await fetch(`/api/branding/domain?${qs}`, {
                method: "DELETE",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) {
                const j = (await res.json().catch(() => null));
                setMsg((_a = j === null || j === void 0 ? void 0 : j.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                return;
            }
            setDomains((list) => list.filter((x) => x.id !== id));
            setMsg("Removed.");
        }
        finally {
            setBusy(false);
        }
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-wrap gap-2 items-end", children: [_jsxs("label", { className: "flex flex-col gap-1 text-xs text-[var(--z-muted)]", children: ["Add domain", _jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "portal.school.com", disabled: !canWrite || busy, className: "h-9 min-w-[240px] rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 text-sm text-[var(--z-fg)]" })] }), _jsx("button", { type: "button", disabled: !canWrite || busy, onClick: addDomain, className: "h-9 rounded-[var(--z-radius-sm)] border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 text-xs font-semibold text-[#00ff88] disabled:opacity-50", children: "Add" })] }), _jsx(DNSStatusPanel, { domain: ((_b = (_a = domains[0]) === null || _a === void 0 ? void 0 : _a.domain_name) === null || _b === void 0 ? void 0 : _b.trim()) ||
                    (name.trim() ? name.trim() : null) }, ((_d = (_c = domains[0]) === null || _c === void 0 ? void 0 : _c.domain_name) === null || _d === void 0 ? void 0 : _d.trim()) ||
                name.trim() ||
                "__no_domain__"), _jsx("ul", { className: "space-y-2", children: domains.map((d) => {
                    var _a;
                    return (_jsxs("li", { className: "flex flex-wrap items-center justify-between gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2", children: [_jsxs("div", { children: [_jsx("div", { className: "font-mono text-sm text-[var(--z-fg)]", children: d.domain_name }), _jsxs("div", { className: "text-[11px] text-[var(--z-muted)]", children: ["CNAME \u2192 ", (_a = d.verification_target) !== null && _a !== void 0 ? _a : "cname.ziro.work", " \u00B7 token", " ", _jsxs("span", { className: "font-mono", children: [d.verification_token.slice(0, 8), "\u2026"] })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(DomainStatusBadge, { status: d.status }), _jsx("button", { type: "button", disabled: !canWrite || busy, onClick: () => verify(d.id, "verify"), className: "h-8 rounded border border-[var(--z-border)] px-2 text-[11px] text-[var(--z-fg)] disabled:opacity-50", children: "Check DNS" }), _jsx("button", { type: "button", disabled: !canWrite || busy, onClick: () => verify(d.id, "mark_verified"), className: "h-8 rounded border border-[var(--z-border)] px-2 text-[11px] text-[var(--z-fg)] disabled:opacity-50", children: "Mark verified" }), _jsx("button", { type: "button", disabled: !canWrite || busy, onClick: () => verify(d.id, "activate"), className: "h-8 rounded border border-[#00ff88]/40 px-2 text-[11px] text-[#00ff88] disabled:opacity-50", children: "Activate" }), _jsx("button", { type: "button", disabled: !canWrite || busy, onClick: () => remove(d.id), className: "h-8 rounded border border-[var(--z-border)] px-2 text-[11px] text-[var(--z-muted)] disabled:opacity-50", children: "Remove" })] })] }, d.id));
                }) }), msg ? _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: msg }) : null] }));
}

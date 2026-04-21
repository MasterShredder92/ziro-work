"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { FeatureFlagToggle } from "../components/FeatureFlagToggle";
export function FeatureFlagsGrid({ tenantId, initial, canWrite, }) {
    const [flags, setFlags] = useState(initial);
    const [newKey, setNewKey] = useState("");
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    async function create() {
        var _a;
        setCreating(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/feature-flags?tenantId=${encodeURIComponent(tenantId)}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    key: newKey,
                    name: newName || newKey,
                    enabled: false,
                    rollout_percent: 100,
                }),
            });
            const data = (await res.json().catch(() => null));
            if (!res.ok)
                throw new Error((_a = data === null || data === void 0 ? void 0 : data.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
            if (data === null || data === void 0 ? void 0 : data.data) {
                setFlags((prev) => {
                    const existing = prev.findIndex((f) => f.id === data.data.id);
                    if (existing >= 0) {
                        const next = [...prev];
                        next[existing] = data.data;
                        return next;
                    }
                    return [...prev, data.data];
                });
            }
            setNewKey("");
            setNewName("");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create flag");
        }
        finally {
            setCreating(false);
        }
    }
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [canWrite ? (_jsxs("div", { className: "flex flex-wrap items-end gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsxs("label", { className: "flex flex-1 flex-col gap-1", children: [_jsx("span", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: "Key" }), _jsx("input", { value: newKey, onChange: (e) => setNewKey(e.target.value), placeholder: "eg. ai.chat_streaming", className: "h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 font-mono text-sm" })] }), _jsxs("label", { className: "flex flex-1 flex-col gap-1", children: [_jsx("span", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: "Name" }), _jsx("input", { value: newName, onChange: (e) => setNewName(e.target.value), placeholder: "AI chat streaming", className: "h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 text-sm" })] }), _jsx("button", { type: "button", onClick: create, disabled: creating || !newKey.trim(), className: "h-9 rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-4 text-sm font-semibold text-black disabled:opacity-50", children: creating ? "Saving…" : "Add flag" }), error ? (_jsx("div", { className: "basis-full text-xs text-red-400", children: error })) : null] })) : null, _jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2", children: [flags.map((flag) => (_jsx(FeatureFlagToggle, { tenantId: tenantId, flag: flag, canWrite: canWrite, onUpdated: (next) => setFlags((prev) => prev.map((f) => (f.id === next.id ? next : f))) }, flag.id))), flags.length === 0 ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] p-6 text-center text-sm text-[var(--z-muted)]", children: "No feature flags defined yet." })) : null] })] }));
}

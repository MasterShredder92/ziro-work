"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function FeatureFlagToggle({ tenantId, flag, canWrite, onUpdated, }) {
    const [enabled, setEnabled] = useState(flag.enabled);
    const [rollout, setRollout] = useState(flag.rollout_percent);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    async function save(nextEnabled, nextRollout) {
        var _a;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/feature-flags?tenantId=${encodeURIComponent(tenantId)}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    id: flag.id,
                    key: flag.key,
                    enabled: nextEnabled,
                    rollout_percent: nextRollout,
                }),
            });
            const data = (await res.json().catch(() => null));
            if (!res.ok)
                throw new Error((_a = data === null || data === void 0 ? void 0 : data.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
            if (data === null || data === void 0 ? void 0 : data.data)
                onUpdated === null || onUpdated === void 0 ? void 0 : onUpdated(data.data);
        }
        catch (err) {
            setEnabled(flag.enabled);
            setRollout(flag.rollout_percent);
            setError(err instanceof Error ? err.message : "Failed to update flag");
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "flex flex-col gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "font-semibold text-[var(--z-fg)]", children: flag.name }), _jsx("div", { className: "font-mono text-xs text-[var(--z-muted)]", children: flag.key }), flag.description ? (_jsx("p", { className: "mt-1 text-xs text-[var(--z-muted)]", children: flag.description })) : null] }), _jsxs("label", { className: "inline-flex shrink-0 items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: enabled, disabled: !canWrite || saving, onChange: (e) => {
                                    const v = e.target.checked;
                                    setEnabled(v);
                                    void save(v, rollout);
                                } }), _jsx("span", { children: enabled ? "Enabled" : "Disabled" })] })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs("label", { className: "flex flex-1 flex-col gap-1", children: [_jsxs("span", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: ["Rollout ", rollout, "%"] }), _jsx("input", { type: "range", min: 0, max: 100, step: 5, value: rollout, disabled: !canWrite || saving, onChange: (e) => setRollout(Number(e.target.value)), onMouseUp: () => void save(enabled, rollout), onTouchEnd: () => void save(enabled, rollout) })] }) }), flag.target_roles.length > 0 ? (_jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Target roles:", " ", flag.target_roles.map((r) => (_jsx("span", { className: "mr-1 rounded-full border border-[var(--z-border)] px-2 py-0.5 font-mono", children: r }, r)))] })) : null, error ? (_jsx("div", { className: "text-xs text-red-400", children: error })) : null] }));
}

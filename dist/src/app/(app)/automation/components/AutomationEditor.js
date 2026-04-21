"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TriggerSelector } from "./TriggerSelector";
import { ConditionBuilder } from "./ConditionBuilder";
import { ActionBuilder } from "./ActionBuilder";
export function AutomationEditor({ rule, tenantId }) {
    var _a, _b, _c, _d, _e, _f;
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState(null);
    const [status, setStatus] = useState(null);
    const [name, setName] = useState((_a = rule === null || rule === void 0 ? void 0 : rule.name) !== null && _a !== void 0 ? _a : "");
    const [description, setDescription] = useState((_b = rule === null || rule === void 0 ? void 0 : rule.description) !== null && _b !== void 0 ? _b : "");
    const [enabled, setEnabled] = useState((_c = rule === null || rule === void 0 ? void 0 : rule.enabled) !== null && _c !== void 0 ? _c : true);
    const [trigger, setTrigger] = useState((_d = rule === null || rule === void 0 ? void 0 : rule.trigger) !== null && _d !== void 0 ? _d : { event: "lead.created" });
    const [conditions, setConditions] = useState((_e = rule === null || rule === void 0 ? void 0 : rule.conditions) !== null && _e !== void 0 ? _e : []);
    const [actions, setActions] = useState((_f = rule === null || rule === void 0 ? void 0 : rule.actions) !== null && _f !== void 0 ? _f : []);
    const save = useCallback(async () => {
        setError(null);
        setStatus(null);
        if (!name.trim()) {
            setError("Name is required.");
            return;
        }
        const body = {
            name: name.trim(),
            description: description.trim() ? description.trim() : null,
            enabled,
            trigger,
            conditions,
            actions,
        };
        startTransition(async () => {
            var _a;
            try {
                const url = rule
                    ? `/automation/api/rules/${encodeURIComponent(rule.id)}`
                    : `/automation/api/rules`;
                const method = rule ? "PATCH" : "POST";
                const res = await fetch(url, {
                    method,
                    headers: {
                        "content-type": "application/json",
                        "x-tenant-id": tenantId,
                    },
                    body: JSON.stringify(body),
                });
                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(text || `Failed to save (${res.status})`);
                }
                const saved = (await res.json());
                setStatus("Saved.");
                if (!rule && ((_a = saved.data) === null || _a === void 0 ? void 0 : _a.id)) {
                    router.replace(`/automation/${saved.data.id}`);
                }
                else {
                    router.refresh();
                }
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "Save failed");
            }
        });
    }, [
        name,
        description,
        enabled,
        trigger,
        conditions,
        actions,
        rule,
        tenantId,
        router,
    ]);
    const remove = useCallback(async () => {
        if (!rule)
            return;
        if (!confirm(`Delete automation "${rule.name}"?`))
            return;
        startTransition(async () => {
            try {
                const res = await fetch(`/automation/api/rules/${encodeURIComponent(rule.id)}`, {
                    method: "DELETE",
                    headers: { "x-tenant-id": tenantId },
                });
                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(text || `Failed to delete (${res.status})`);
                }
                router.replace("/automation");
                router.refresh();
            }
            catch (err) {
                setError(err instanceof Error ? err.message : "Delete failed");
            }
        });
    }, [rule, tenantId, router]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Automation rule" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: rule ? rule.name : "New automation" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("label", { className: "inline-flex items-center gap-2 text-xs font-semibold text-[var(--z-muted)]", children: [_jsx("input", { type: "checkbox", checked: enabled, onChange: (e) => setEnabled(e.target.checked), className: "h-4 w-4" }), "Enabled"] }), _jsx("button", { type: "button", onClick: save, disabled: isPending, className: "rounded-[var(--z-radius-md)] bg-[#00ff88] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#00e679] disabled:opacity-60", children: isPending ? "Saving…" : "Save" }), rule ? (_jsx("button", { type: "button", onClick: remove, disabled: isPending, className: "rounded-[var(--z-radius-md)] border border-[var(--z-danger)]/40 px-3 py-1.5 text-sm font-semibold text-[var(--z-danger)] hover:bg-[var(--z-danger)]/10 disabled:opacity-60", children: "Delete" })) : null] })] }), error ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-danger)]/40 bg-[var(--z-danger)]/10 px-3 py-2 text-xs text-[var(--z-danger)]", children: error })) : null, status ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300", children: status })) : null, _jsxs("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Name" }), _jsx("input", { type: "text", value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. Welcome new lead", className: "mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Description" }), _jsx("textarea", { value: description !== null && description !== void 0 ? description : "", onChange: (e) => setDescription(e.target.value), rows: 2, placeholder: "Optional description", className: "mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]" })] })] }), _jsx("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: _jsx(TriggerSelector, { value: trigger, onChange: setTrigger, disabled: isPending }) }), _jsx("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: _jsx(ConditionBuilder, { conditions: conditions, onChange: setConditions, disabled: isPending }) }), _jsx("section", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: _jsx(ActionBuilder, { actions: actions, onChange: setActions, disabled: isPending }) })] }));
}

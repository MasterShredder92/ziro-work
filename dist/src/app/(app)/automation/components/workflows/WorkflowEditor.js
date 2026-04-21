"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ACTION_CATALOG, TRIGGER_CATALOG, } from "@/lib/automation/workflows/types";
import { TriggerEditor } from "./TriggerEditor";
import { ActionEditor } from "./ActionEditor";
import { WorkflowRunHistory } from "./WorkflowRunHistory";
function newActionId() {
    return `act_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}
export function WorkflowEditor({ workflow, mode }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState(null);
    const [name, setName] = useState((_a = workflow === null || workflow === void 0 ? void 0 : workflow.name) !== null && _a !== void 0 ? _a : "New workflow");
    const [description, setDescription] = useState((_b = workflow === null || workflow === void 0 ? void 0 : workflow.description) !== null && _b !== void 0 ? _b : "");
    const [status, setStatus] = useState((_c = workflow === null || workflow === void 0 ? void 0 : workflow.status) !== null && _c !== void 0 ? _c : "draft");
    const [trigger, setTrigger] = useState((_d = workflow === null || workflow === void 0 ? void 0 : workflow.trigger) !== null && _d !== void 0 ? _d : { type: "custom.webhook" });
    const [actions, setActions] = useState((_e = workflow === null || workflow === void 0 ? void 0 : workflow.actions) !== null && _e !== void 0 ? _e : []);
    const [retryMax, setRetryMax] = useState((_f = workflow === null || workflow === void 0 ? void 0 : workflow.retry_max) !== null && _f !== void 0 ? _f : 3);
    const [retryBackoffMs, setRetryBackoffMs] = useState((_g = workflow === null || workflow === void 0 ? void 0 : workflow.retry_backoff_ms) !== null && _g !== void 0 ? _g : 1000);
    const [concurrencyLimit, setConcurrencyLimit] = useState((workflow === null || workflow === void 0 ? void 0 : workflow.concurrency_limit) != null ? String(workflow.concurrency_limit) : "");
    const [tags, setTags] = useState(((_h = workflow === null || workflow === void 0 ? void 0 : workflow.tags) !== null && _h !== void 0 ? _h : []).join(", "));
    const [isTriggerEditorOpen, setIsTriggerEditorOpen] = useState(false);
    const [editingActionId, setEditingActionId] = useState(null);
    const [isRunHistoryOpen, setIsRunHistoryOpen] = useState(false);
    const [draggingActionId, setDraggingActionId] = useState(null);
    const triggerEntry = useMemo(() => { var _a; return (_a = TRIGGER_CATALOG.find((t) => t.type === trigger.type)) !== null && _a !== void 0 ? _a : null; }, [trigger.type]);
    function addAction(type) {
        setActions((prev) => [
            ...prev,
            { id: newActionId(), type, config: {}, onError: "fail" },
        ]);
    }
    function updateAction(id, patch) {
        setActions((prev) => prev.map((a) => (a.id === id ? Object.assign(Object.assign({}, a), patch) : a)));
    }
    function moveAction(id, dir) {
        setActions((prev) => {
            const idx = prev.findIndex((a) => a.id === id);
            if (idx === -1)
                return prev;
            const target = idx + dir;
            if (target < 0 || target >= prev.length)
                return prev;
            const next = [...prev];
            const tmp = next[idx];
            next[idx] = next[target];
            next[target] = tmp;
            return next;
        });
    }
    function removeAction(id) {
        setActions((prev) => prev.filter((a) => a.id !== id));
    }
    function reorderAction(sourceId, targetId) {
        if (sourceId === targetId)
            return;
        setActions((prev) => {
            const sourceIndex = prev.findIndex((item) => item.id === sourceId);
            const targetIndex = prev.findIndex((item) => item.id === targetId);
            if (sourceIndex < 0 || targetIndex < 0)
                return prev;
            const next = [...prev];
            const [moved] = next.splice(sourceIndex, 1);
            if (!moved)
                return prev;
            next.splice(targetIndex, 0, moved);
            return next;
        });
    }
    async function save() {
        var _a, _b, _c;
        setError(null);
        const payload = {
            name: name.trim(),
            description: description.trim() || null,
            status,
            trigger,
            actions,
            retryMax,
            retryBackoffMs,
            concurrencyLimit: concurrencyLimit ? Number(concurrencyLimit) : null,
            tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
        };
        const url = mode === "create"
            ? "/automation/api/workflows"
            : `/automation/api/workflows/${workflow === null || workflow === void 0 ? void 0 : workflow.id}`;
        const method = mode === "create" ? "POST" : "PATCH";
        try {
            const res = await fetch(url, {
                method,
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setError((_a = data === null || data === void 0 ? void 0 : data.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                return;
            }
            const data = await res.json();
            const id = (_c = (_b = data === null || data === void 0 ? void 0 : data.data) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : workflow === null || workflow === void 0 ? void 0 : workflow.id;
            if (id) {
                startTransition(() => {
                    router.push(`/automation/workflows/${id}`);
                    router.refresh();
                });
            }
            else {
                startTransition(() => {
                    router.push("/automation/workflows");
                    router.refresh();
                });
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }
    async function destroy() {
        var _a;
        if (!workflow)
            return;
        if (!confirm("Delete this workflow? This cannot be undone."))
            return;
        try {
            const res = await fetch(`/automation/api/workflows/${workflow.id}`, {
                method: "DELETE",
            });
            if (!res.ok && res.status !== 204) {
                const data = await res.json().catch(() => null);
                setError((_a = data === null || data === void 0 ? void 0 : data.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                return;
            }
            startTransition(() => {
                router.push("/automation/workflows");
                router.refresh();
            });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }
    async function runNow() {
        var _a, _b;
        if (!workflow)
            return;
        try {
            const res = await fetch(`/automation/api/workflows/${workflow.id}/run`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ payload: {} }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                setError((_a = data === null || data === void 0 ? void 0 : data.error) !== null && _a !== void 0 ? _a : `HTTP ${res.status}`);
                return;
            }
            if ((_b = data === null || data === void 0 ? void 0 : data.data) === null || _b === void 0 ? void 0 : _b.id) {
                router.push(`/automation/runs/${data.data.id}`);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: mode === "create" ? "New workflow" : "Edit workflow" }), _jsx("input", { value: name, onChange: (e) => setName(e.target.value), className: "mt-1 w-full bg-transparent text-xl sm:text-2xl font-semibold text-[var(--z-fg)] focus:outline-none border-b border-transparent focus:border-[var(--z-border)]", placeholder: "Workflow name" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => setStatus((prev) => (prev === "active" ? "paused" : "active")), disabled: isPending, className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-sm text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-40", title: "Enable/disable workflow", children: status === "active" ? "Disable" : "Enable" }), workflow ? (_jsx("button", { onClick: () => setIsRunHistoryOpen(true), className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-sm text-[var(--z-fg)] hover:bg-white/5", children: "Run history" })) : null, workflow ? (_jsx("button", { onClick: runNow, disabled: isPending || status !== "active", className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-sm text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-40", title: status !== "active" ? "Workflow must be active" : "", children: "Run now" })) : null, workflow ? (_jsx("button", { onClick: destroy, disabled: isPending, className: "rounded-[var(--z-radius-md)] border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/20", children: "Delete" })) : null, _jsx("button", { onClick: save, disabled: isPending, className: "rounded-[var(--z-radius-md)] bg-[#00ff88] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#00e679] disabled:opacity-40", children: isPending ? "Saving..." : "Save" })] })] }), error ? (_jsx("div", { className: "rounded-[var(--z-radius-md)] border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300", children: error })) : null, _jsxs("section", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [_jsxs("div", { className: "lg:col-span-2 space-y-4", children: [_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)] mb-3 font-semibold", children: "Description" }), _jsx("textarea", { value: description !== null && description !== void 0 ? description : "", onChange: (e) => setDescription(e.target.value), rows: 2, className: "w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]", placeholder: "What does this workflow do?" })] }), _jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { className: "mb-3 flex items-center justify-between", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Trigger" }), _jsx("button", { type: "button", onClick: () => setIsTriggerEditorOpen(true), className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-fg)] hover:bg-white/5", children: "Edit trigger" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("select", { value: trigger.type, onChange: (e) => setTrigger((prev) => (Object.assign(Object.assign({}, prev), { type: e.target.value, config: {} }))), className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]", children: TRIGGER_CATALOG.map((t) => (_jsx("option", { value: t.type, children: t.label }, t.type))) }), (triggerEntry === null || triggerEntry === void 0 ? void 0 : triggerEntry.description) ? (_jsx("div", { className: "text-xs text-[var(--z-muted)] self-center", children: triggerEntry.description })) : null] }), _jsx("div", { className: "mt-3 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] p-2 text-xs text-[var(--z-muted)]", children: Object.keys((_j = trigger.config) !== null && _j !== void 0 ? _j : {}).length > 0 ? (_jsx("pre", { className: "whitespace-pre-wrap break-all text-[11px]", children: JSON.stringify(trigger.config, null, 2) })) : ("No trigger config set.") })] }), _jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: ["Actions (", actions.length, ")"] }), _jsxs("select", { value: "", onChange: (e) => {
                                                    if (e.target.value) {
                                                        addAction(e.target.value);
                                                        e.target.value = "";
                                                    }
                                                }, className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-1.5 text-xs text-[var(--z-fg)]", children: [_jsx("option", { value: "", children: "+ Add action" }), ACTION_CATALOG.map((a) => (_jsx("option", { value: a.type, children: a.label }, a.type)))] })] }), _jsxs("div", { className: "space-y-2", children: [actions.length === 0 ? (_jsx("div", { className: "text-xs text-[var(--z-muted)] italic", children: "No actions yet." })) : null, actions.map((action, i) => {
                                                var _a, _b, _c, _d;
                                                const catalog = ACTION_CATALOG.find((c) => c.type === action.type);
                                                return (_jsxs("div", { draggable: true, onDragStart: () => setDraggingActionId(action.id), onDragOver: (e) => e.preventDefault(), onDrop: (e) => {
                                                        e.preventDefault();
                                                        if (draggingActionId)
                                                            reorderAction(draggingActionId, action.id);
                                                        setDraggingActionId(null);
                                                    }, onDragEnd: () => setDraggingActionId(null), className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] p-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-2 mb-2", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsxs("span", { className: "text-[10px] font-mono text-[var(--z-muted)]", children: ["#", i + 1] }), _jsx("span", { className: "text-sm font-medium text-[var(--z-fg)]", children: (_a = catalog === null || catalog === void 0 ? void 0 : catalog.label) !== null && _a !== void 0 ? _a : action.type }), _jsx("span", { className: "text-[10px] text-[var(--z-muted)] font-mono truncate", children: action.type })] }), _jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [_jsx("button", { onClick: () => moveAction(action.id, -1), className: "rounded px-2 py-0.5 text-xs text-[var(--z-muted)] hover:bg-white/5", children: "\u2191" }), _jsx("button", { onClick: () => moveAction(action.id, 1), className: "rounded px-2 py-0.5 text-xs text-[var(--z-muted)] hover:bg-white/5", children: "\u2193" }), _jsx("button", { onClick: () => setEditingActionId(action.id), className: "rounded px-2 py-0.5 text-xs text-[var(--z-fg)] hover:bg-white/5", children: "Edit" }), _jsx("button", { onClick: () => removeAction(action.id), className: "rounded px-2 py-0.5 text-xs text-rose-300 hover:bg-rose-500/15", children: "Remove" })] })] }), (catalog === null || catalog === void 0 ? void 0 : catalog.description) ? (_jsx("div", { className: "text-[11px] text-[var(--z-muted)] mb-2", children: catalog.description })) : null, _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: [_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]", children: ["Label: ", ((_b = action.label) === null || _b === void 0 ? void 0 : _b.trim()) ? action.label : "—"] }), _jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]", children: ["On error: ", (_c = action.onError) !== null && _c !== void 0 ? _c : "fail"] })] }), _jsx("div", { className: "mt-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-2 text-[11px] text-[var(--z-muted)]", children: Object.keys((_d = action.config) !== null && _d !== void 0 ? _d : {}).length > 0 ? (_jsx("pre", { className: "whitespace-pre-wrap break-all text-[11px]", children: JSON.stringify(action.config, null, 2) })) : ("No action config set.") })] }, action.id));
                                            })] })] })] }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Settings" }), _jsxs("div", { children: [_jsx("label", { className: "block text-[11px] text-[var(--z-muted)] mb-1", children: "Status" }), _jsxs("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]", children: [_jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "paused", children: "Paused" }), _jsx("option", { value: "archived", children: "Archived" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-[11px] text-[var(--z-muted)] mb-1", children: "Retry max" }), _jsx("input", { type: "number", value: retryMax, min: 0, max: 10, onChange: (e) => setRetryMax(Number(e.target.value)), className: "w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-[11px] text-[var(--z-muted)] mb-1", children: "Retry backoff (ms)" }), _jsx("input", { type: "number", value: retryBackoffMs, min: 0, onChange: (e) => setRetryBackoffMs(Number(e.target.value)), className: "w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-[11px] text-[var(--z-muted)] mb-1", children: "Concurrency limit (empty = no limit)" }), _jsx("input", { type: "number", value: concurrencyLimit, min: 0, onChange: (e) => setConcurrencyLimit(e.target.value), className: "w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-[11px] text-[var(--z-muted)] mb-1", children: "Tags (comma separated)" }), _jsx("input", { value: tags, onChange: (e) => setTags(e.target.value), className: "w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]" })] })] }) })] }), _jsx(TriggerEditor, { open: isTriggerEditorOpen, trigger: trigger, onClose: () => setIsTriggerEditorOpen(false), onSave: (next) => setTrigger(next) }), _jsx(ActionEditor, { open: Boolean(editingActionId), action: (_k = actions.find((item) => item.id === editingActionId)) !== null && _k !== void 0 ? _k : null, onClose: () => setEditingActionId(null), onSave: (next) => updateAction(next.id, next) }), _jsx(WorkflowRunHistory, { open: isRunHistoryOpen, workflowId: (_l = workflow === null || workflow === void 0 ? void 0 : workflow.id) !== null && _l !== void 0 ? _l : null, onClose: () => setIsRunHistoryOpen(false) })] }));
}

"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const KINDS = [
    "runSkill",
    "sendMessage",
    "createNote",
    "scheduleFollowup",
];
function defaultActionFor(kind) {
    switch (kind) {
        case "runSkill":
            return { kind, skillId: "ziro.kpiSnapshot" };
        case "sendMessage":
            return { kind, profileId: "", body: "" };
        case "createNote":
            return { kind, entityId: "", body: "", entityType: "student" };
        case "scheduleFollowup":
            return {
                kind,
                profileId: "",
                date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
                note: "",
            };
        default:
            return { kind: "runSkill", skillId: "ziro.kpiSnapshot" };
    }
}
export function ActionBuilder({ actions, onChange, disabled }) {
    const add = (kind) => {
        onChange([...actions, defaultActionFor(kind)]);
    };
    const remove = (index) => {
        onChange(actions.filter((_, i) => i !== index));
    };
    const update = (index, patch) => {
        const next = actions.slice();
        next[index] = Object.assign(Object.assign({}, next[index]), patch);
        onChange(next);
    };
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]", children: "Actions (run in order)" }), _jsx("div", { className: "flex flex-wrap gap-2", children: KINDS.map((k) => (_jsxs("button", { type: "button", disabled: disabled, onClick: () => add(k), className: "text-[11px] font-semibold text-[var(--z-accent)] hover:underline disabled:opacity-50", children: ["+ ", k] }, k))) })] }), actions.length === 0 ? (_jsx("div", { className: "text-xs text-[var(--z-muted)] italic", children: "No actions yet. Add one to define what the rule does." })) : (_jsx("div", { className: "space-y-2", children: actions.map((a, i) => {
                    var _a, _b, _c, _d, _e;
                    return (_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-accent)]", children: a.kind }), _jsx("button", { type: "button", disabled: disabled, onClick: () => remove(i), className: "text-xs text-[var(--z-danger)] hover:underline disabled:opacity-50", children: "Remove" })] }), a.kind === "runSkill" ? (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: [_jsx("input", { type: "text", value: a.skillId, disabled: disabled, placeholder: "agent.skill", onChange: (e) => update(i, { skillId: e.target.value }), className: "rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs font-mono text-[var(--z-fg)]" }), _jsx("input", { type: "text", value: (_a = a.input) !== null && _a !== void 0 ? _a : "", disabled: disabled, placeholder: "input", onChange: (e) => update(i, { input: e.target.value }), className: "rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]" })] })) : null, a.kind === "sendMessage" ? (_jsxs("div", { className: "space-y-2", children: [_jsx("input", { type: "text", value: a.profileId, disabled: disabled, placeholder: "target profileId", onChange: (e) => update(i, { profileId: e.target.value }), className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs font-mono text-[var(--z-fg)]" }), _jsx("textarea", { value: a.body, disabled: disabled, placeholder: "Message body", rows: 3, onChange: (e) => update(i, { body: e.target.value }), className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]" })] })) : null, a.kind === "createNote" ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: [_jsx("input", { type: "text", value: a.entityId, disabled: disabled, placeholder: "entityId", onChange: (e) => update(i, { entityId: e.target.value }), className: "rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs font-mono text-[var(--z-fg)]" }), _jsx("input", { type: "text", value: (_b = a.entityType) !== null && _b !== void 0 ? _b : "", disabled: disabled, placeholder: "entityType (student, lead, ...)", onChange: (e) => update(i, { entityType: e.target.value }), className: "rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]" })] }), _jsx("textarea", { value: a.body, disabled: disabled, placeholder: "Note body", rows: 3, onChange: (e) => update(i, { body: e.target.value }), className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]" })] })) : null, a.kind === "scheduleFollowup" ? (_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-2", children: [_jsx("input", { type: "text", value: a.profileId, disabled: disabled, placeholder: "profileId", onChange: (e) => update(i, { profileId: e.target.value }), className: "rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs font-mono text-[var(--z-fg)]" }), _jsx("input", { type: "date", value: (_d = (_c = a.date) === null || _c === void 0 ? void 0 : _c.slice(0, 10)) !== null && _d !== void 0 ? _d : "", disabled: disabled, onChange: (e) => update(i, { date: e.target.value }), className: "rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]" }), _jsx("input", { type: "text", value: (_e = a.note) !== null && _e !== void 0 ? _e : "", disabled: disabled, placeholder: "note", onChange: (e) => update(i, { note: e.target.value }), className: "rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]" })] })) : null] }, i));
                }) }))] }));
}

"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export function AIDraftPanel({ tenantId, plan, canWrite }) {
    var _a, _b, _c, _d, _e, _f;
    const [form, setForm] = useState({
        title: (_a = plan === null || plan === void 0 ? void 0 : plan.title) !== null && _a !== void 0 ? _a : "",
        subject: (_b = plan === null || plan === void 0 ? void 0 : plan.subject) !== null && _b !== void 0 ? _b : "",
        gradeLevel: (_c = plan === null || plan === void 0 ? void 0 : plan.grade_level) !== null && _c !== void 0 ? _c : "",
        durationMinutes: (_d = plan === null || plan === void 0 ? void 0 : plan.duration_minutes) !== null && _d !== void 0 ? _d : 45,
        standards: (_f = (_e = plan === null || plan === void 0 ? void 0 : plan.standards) === null || _e === void 0 ? void 0 : _e.join(", ")) !== null && _f !== void 0 ? _f : "",
        focusAreas: "",
        prompt: "",
    });
    const [busy, setBusy] = useState(null);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [draft, setDraft] = useState(null);
    function update(key, value) {
        setForm((prev) => (Object.assign(Object.assign({}, prev), { [key]: value })));
    }
    async function runDraft() {
        var _a;
        setBusy("draft");
        setError(null);
        setMessage(null);
        try {
            const res = await fetch("/lesson-planner/api/draft", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    request: {
                        tenantId,
                        planId: (_a = plan === null || plan === void 0 ? void 0 : plan.id) !== null && _a !== void 0 ? _a : null,
                        title: form.title || undefined,
                        subject: form.subject || undefined,
                        gradeLevel: form.gradeLevel || undefined,
                        durationMinutes: form.durationMinutes || undefined,
                        standards: parseCSV(form.standards),
                        focusAreas: parseCSV(form.focusAreas),
                        prompt: form.prompt || undefined,
                    },
                }),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || `Draft failed (${res.status})`);
            }
            const body = (await res.json());
            setDraft(body.data.draft);
            setMessage("Draft ready — review and save to create a version.");
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Draft failed");
        }
        finally {
            setBusy(null);
        }
    }
    async function saveDraft() {
        var _a;
        if (!draft)
            return;
        setBusy("save");
        setError(null);
        try {
            const res = await fetch("/lesson-planner/api/version", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    planId: (_a = plan === null || plan === void 0 ? void 0 : plan.id) !== null && _a !== void 0 ? _a : null,
                    draft,
                }),
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(text || `Save failed (${res.status})`);
            }
            setMessage("Saved. Reload the page to see the updated version.");
        }
        catch (e) {
            setError(e instanceof Error ? e.message : "Save failed");
        }
        finally {
            setBusy(null);
        }
    }
    return (_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Ziro AI" }), _jsx("h3", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Draft a lesson plan with AI" }), _jsx("p", { className: "mt-1 text-xs text-[var(--z-muted)]", children: "Generate objectives, activities, and materials aligned to your standards. Review and save to create a new version." })] }), _jsx("span", { className: "rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Beta" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsx(Field, { label: "Title", children: _jsx("input", { type: "text", value: form.title, onChange: (e) => update("title", e.target.value), placeholder: "e.g. Intro to rhythm", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#00ff88]/50" }) }), _jsx(Field, { label: "Subject", children: _jsx("input", { type: "text", value: form.subject, onChange: (e) => update("subject", e.target.value), placeholder: "e.g. Music theory", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#00ff88]/50" }) }), _jsx(Field, { label: "Grade level", children: _jsx("input", { type: "text", value: form.gradeLevel, onChange: (e) => update("gradeLevel", e.target.value), placeholder: "e.g. Beginner", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#00ff88]/50" }) }), _jsx(Field, { label: "Duration (min)", children: _jsx("input", { type: "number", min: 5, max: 240, value: form.durationMinutes, onChange: (e) => update("durationMinutes", Number(e.target.value) || 0), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#00ff88]/50" }) }), _jsx(Field, { label: "Standards (comma separated)", wide: true, children: _jsx("input", { type: "text", value: form.standards, onChange: (e) => update("standards", e.target.value), placeholder: "MU:Pr4.1, MU:Re7.2", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#00ff88]/50" }) }), _jsx(Field, { label: "Focus areas (comma separated)", wide: true, children: _jsx("input", { type: "text", value: form.focusAreas, onChange: (e) => update("focusAreas", e.target.value), placeholder: "listening, improvisation", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#00ff88]/50" }) }), _jsx(Field, { label: "Prompt (optional)", wide: true, children: _jsx("textarea", { value: form.prompt, onChange: (e) => update("prompt", e.target.value), rows: 3, placeholder: "Anything specific you want the draft to cover?", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#00ff88]/50" }) })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("button", { type: "button", disabled: !canWrite || busy !== null, onClick: runDraft, className: "rounded-md border border-[#00ff88]/40 bg-[#00ff88]/10 px-3 py-1.5 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 disabled:opacity-50", children: busy === "draft" ? "Drafting…" : "Generate draft" }), _jsx("button", { type: "button", disabled: !canWrite || !draft || busy !== null, onClick: saveDraft, className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:border-[#00ff88]/40 hover:text-[#00ff88] disabled:opacity-50", children: busy === "save" ? "Saving…" : "Save as new version" }), message ? (_jsx("span", { className: "text-xs text-[#00ff88]", children: message })) : null, error ? (_jsx("span", { className: "text-xs text-[var(--z-danger)]", children: error })) : null] }), draft ? _jsx("div", { className: "mt-2", children: renderDraft(draft) }) : null] }));
}
function Field({ label, children, wide, }) {
    return (_jsxs("label", { className: wide ? "md:col-span-2 block" : "block", children: [_jsx("span", { className: "text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("div", { className: "mt-1", children: children })] }));
}
function parseCSV(value) {
    return value
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
}
function renderDraft(draft) {
    return (_jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),black_6%)] p-3 space-y-3 text-xs", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Proposed title" }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: draft.title }), _jsx("p", { className: "mt-1 text-[var(--z-muted)]", children: draft.summary })] }), _jsxs("section", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Objectives" }), _jsx("ol", { className: "mt-1 list-decimal space-y-1 pl-4 text-[var(--z-fg)]", children: draft.objectives.map((o, i) => (_jsxs("li", { children: [o.text, o.bloom_level ? (_jsx("span", { className: "ml-2 rounded-full border border-[var(--z-border)] px-1.5 py-0.5 text-[10px] uppercase text-[var(--z-muted)]", children: o.bloom_level })) : null] }, i))) })] }), _jsxs("section", { children: [_jsxs("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: ["Activities (", draft.estimatedDurationMinutes, " min total)"] }), _jsx("ol", { className: "mt-1 list-decimal space-y-1 pl-4 text-[var(--z-fg)]", children: draft.activities.map((a, i) => (_jsxs("li", { children: [_jsx("span", { className: "font-semibold", children: a.title }), a.duration_minutes ? ` · ${a.duration_minutes} min` : "", a.kind ? ` · ${a.kind.replace(/_/g, " ")}` : "", a.description ? (_jsx("div", { className: "text-[var(--z-muted)]", children: a.description })) : null] }, i))) })] }), _jsxs("section", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Materials" }), _jsx("ul", { className: "mt-1 list-disc space-y-1 pl-4 text-[var(--z-fg)]", children: draft.materials.map((m, i) => (_jsxs("li", { children: [m.title, m.kind ? ` · ${m.kind}` : ""] }, i))) })] }), draft.curriculumAlignment.length > 0 ? (_jsxs("section", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Curriculum alignment" }), _jsx("div", { className: "mt-1 flex flex-wrap gap-1", children: draft.curriculumAlignment.map((c) => (_jsx("span", { className: "rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] text-[var(--z-muted)]", children: c }, c))) })] })) : null] }));
}

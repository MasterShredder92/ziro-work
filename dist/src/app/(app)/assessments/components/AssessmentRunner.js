"use client";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
export function AssessmentRunner({ surface, studentId, }) {
    const router = useRouter();
    const [state, setState] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const startedAt = useMemo(() => new Date(), []);
    function updateAnswer(qid, value) {
        setState((prev) => (Object.assign(Object.assign({}, prev), { [qid]: value })));
    }
    async function onSubmit() {
        setSubmitting(true);
        setError(null);
        try {
            const answers = surface.questions.map((q) => {
                var _a;
                return ({
                    question_id: q.id,
                    response: (_a = state[q.id]) !== null && _a !== void 0 ? _a : null,
                });
            });
            const res = await fetch(`/assessments/api/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    assessmentId: surface.assessment.id,
                    studentId,
                    answers,
                    durationSeconds: Math.floor((Date.now() - startedAt.getTime()) / 1000),
                }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Submit failed (${res.status})`);
            }
            const data = (await res.json());
            router.push(`/assessments/attempt/${data.attempt.id}`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "Submit failed";
            setError(msg);
        }
        finally {
            setSubmitting(false);
        }
    }
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5", children: [_jsxs("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: [surface.assessment.kind, " \u00B7 Runner"] }), _jsx("h1", { className: "mt-1 text-lg font-semibold text-[var(--z-fg)]", children: surface.assessment.title }), surface.assessment.description ? (_jsx("p", { className: "mt-1 text-sm text-[var(--z-muted)]", children: surface.assessment.description })) : null] }), surface.questions.length === 0 ? (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)]", children: "This assessment has no questions yet." })) : (_jsx("ol", { className: "space-y-3", children: surface.questions.map((q, idx) => (_jsx(QuestionInput, { index: idx, question: q, value: state[q.id], onChange: (v) => updateAnswer(q.id, v) }, q.id))) })), error ? (_jsx("div", { className: "rounded-md border border-red-400/40 bg-red-400/10 px-3 py-2 text-xs text-red-200", children: error })) : null, _jsx("div", { className: "flex items-center justify-end gap-2", children: _jsx("button", { type: "button", disabled: submitting || surface.questions.length === 0, onClick: onSubmit, className: "rounded-md border border-[#00ff88]/40 bg-[#00ff88]/15 px-4 py-2 text-xs font-semibold text-[#00ff88] disabled:opacity-50 hover:bg-[#00ff88]/25", children: submitting ? "Submitting…" : "Submit attempt" }) })] }));
}
function QuestionInput({ index, question, value, onChange, }) {
    return (_jsxs("li", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: ["Q", index + 1, " \u00B7 ", question.kind, " \u00B7 ", question.points, "pt"] }), _jsx("div", { className: "mt-1 text-sm text-[var(--z-fg)]", children: question.prompt }), _jsx("div", { className: "mt-3", children: question.kind === "multiple_choice" ? (_jsx("div", { className: "space-y-1", children: question.options.map((opt) => (_jsxs("label", { className: "flex items-center gap-2 text-sm text-[var(--z-fg)]", children: [_jsx("input", { type: "radio", name: question.id, value: opt.id, checked: value === opt.id, onChange: (e) => onChange(e.target.value) }), _jsx("span", { children: opt.label })] }, opt.id))) })) : question.kind === "true_false" ? (_jsx("div", { className: "flex gap-4 text-sm text-[var(--z-fg)]", children: ["true", "false"].map((v) => (_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", name: question.id, value: v, checked: value === v, onChange: (e) => onChange(e.target.value) }), _jsx("span", { className: "capitalize", children: v })] }, v))) })) : question.kind === "short_answer" ? (_jsx("input", { type: "text", value: typeof value === "string" ? value : "", onChange: (e) => onChange(e.target.value), className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]", placeholder: "Your answer\u2026" })) : (_jsx("textarea", { value: typeof value === "string" ? value : "", onChange: (e) => onChange(e.target.value), rows: 4, className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]", placeholder: "Your response\u2026" })) })] }));
}

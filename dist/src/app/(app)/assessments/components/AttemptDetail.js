import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { AssessmentScoreCard } from "./AssessmentScoreCard";
import { RubricView } from "./RubricView";
function questionById(questions, id) {
    var _a;
    return (_a = questions.find((q) => q.id === id)) !== null && _a !== void 0 ? _a : null;
}
function renderResponse(response) {
    if (response == null)
        return "—";
    if (Array.isArray(response))
        return response.join(", ");
    return String(response);
}
export function AttemptDetail({ surface, canGrade, }) {
    var _a;
    const { attempt, assessment, questions, rubric, score } = surface;
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5", children: _jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: ["Attempt \u00B7 ", attempt.status] }), _jsx("h1", { className: "mt-1 text-lg font-semibold text-[var(--z-fg)]", children: (_a = assessment === null || assessment === void 0 ? void 0 : assessment.title) !== null && _a !== void 0 ? _a : attempt.assessment_id }), _jsxs("div", { className: "mt-1 text-xs text-[var(--z-muted)]", children: ["Student ", attempt.student_id, attempt.submitted_at
                                            ? ` · submitted ${new Date(attempt.submitted_at).toLocaleString()}`
                                            : ""] })] }), _jsx(AssessmentScoreCard, { score: score })] }) }), _jsxs("section", { children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)] mb-2", children: "Answers" }), _jsx("ol", { className: "space-y-2", children: attempt.answers.map((ans, idx) => {
                            const q = questionById(questions, ans.question_id);
                            return (_jsxs("li", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: ["Q", idx + 1, q ? ` · ${q.kind} · ${q.points}pt` : ""] }), q ? (_jsx("div", { className: "mt-1 text-sm text-[var(--z-fg)]", children: q.prompt })) : null, _jsxs("div", { className: "mt-2 text-xs text-[var(--z-muted)]", children: ["Response: ", _jsx("span", { className: "text-[var(--z-fg)]", children: renderResponse(ans.response) })] }), _jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[var(--z-muted)]", children: [typeof ans.auto_score === "number" ? (_jsxs("span", { children: ["Auto: ", ans.auto_score] })) : null, typeof ans.manual_score === "number" ? (_jsxs("span", { children: ["Manual: ", ans.manual_score] })) : null, ans.is_correct != null ? (_jsx("span", { className: ans.is_correct ? "text-[#00ff88]" : "text-red-300", children: ans.is_correct ? "Correct" : "Incorrect" })) : null, ans.teacher_notes ? (_jsx("span", { className: "italic", children: ans.teacher_notes })) : null] })] }, ans.question_id));
                        }) })] }), _jsxs("section", { children: [_jsx("h2", { className: "text-sm font-semibold text-[var(--z-fg)] mb-2", children: "Rubric reference" }), _jsx(RubricView, { rubric: rubric })] }), canGrade ? (_jsxs("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] p-4 text-xs text-[var(--z-muted)]", children: ["Grading controls are rendered here. Use POST", _jsxs("code", { className: "mx-1 rounded bg-black/20 px-1", children: ["/assessments/api/attempt/", attempt.id] }), "with rubric/manual scores to finalize grading."] })) : null] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function formatValue(value) {
    if (value === null || value === undefined)
        return "—";
    if (Array.isArray(value))
        return value.map((v) => String(v)).join(", ");
    if (typeof value === "object")
        return JSON.stringify(value);
    return String(value);
}
export function SubmissionDetail({ form, fields, submission, }) {
    var _a, _b, _c;
    const fieldMap = new Map(fields.map((f) => [f.id, f]));
    const fieldByKey = new Map(fields.map((f) => [f.fieldKey, f]));
    const answers = (_a = submission.answers) !== null && _a !== void 0 ? _a : [];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Form" }), _jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: (_b = form === null || form === void 0 ? void 0 : form.name) !== null && _b !== void 0 ? _b : "Unknown form" }), _jsxs("div", { className: "mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs", children: [_jsx(MetaCell, { label: "Status", value: submission.status }), _jsx(MetaCell, { label: "Started", value: submission.startedAt
                                    ? new Date(submission.startedAt).toLocaleString()
                                    : "–" }), _jsx(MetaCell, { label: "Completed", value: submission.completedAt
                                    ? new Date(submission.completedAt).toLocaleString()
                                    : "–" }), _jsx(MetaCell, { label: "Profile", value: (_c = submission.profileId) !== null && _c !== void 0 ? _c : "anonymous" })] })] }), _jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)] text-left", children: [_jsx("th", { className: "px-4 py-2 font-medium text-[var(--z-muted)]", children: "Field" }), _jsx("th", { className: "px-4 py-2 font-medium text-[var(--z-muted)]", children: "Value" })] }) }), _jsx("tbody", { children: answers.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 2, className: "px-4 py-6 text-center text-[var(--z-muted)]", children: "No answers recorded." }) })) : (answers.map((a, idx) => {
                                var _a, _b, _c, _d, _e, _f, _g;
                                const field = (a.fieldId && fieldMap.get(a.fieldId)) ||
                                    (a.fieldKey && fieldByKey.get(a.fieldKey)) ||
                                    null;
                                return (_jsxs("tr", { className: "border-t border-[var(--z-border)]", children: [_jsxs("td", { className: "px-4 py-2 align-top", children: [_jsx("div", { className: "text-[var(--z-fg)]", children: (_c = (_b = (_a = field === null || field === void 0 ? void 0 : field.label) !== null && _a !== void 0 ? _a : a.label) !== null && _b !== void 0 ? _b : a.fieldKey) !== null && _c !== void 0 ? _c : "Field" }), _jsx("div", { className: "text-[11px] text-[var(--z-muted)] font-mono", children: (_e = (_d = a.fieldKey) !== null && _d !== void 0 ? _d : field === null || field === void 0 ? void 0 : field.fieldKey) !== null && _e !== void 0 ? _e : "" })] }), _jsx("td", { className: "px-4 py-2 align-top text-[var(--z-fg)] whitespace-pre-wrap", children: formatValue(a.value) })] }, `${(_g = (_f = a.fieldKey) !== null && _f !== void 0 ? _f : a.fieldId) !== null && _g !== void 0 ? _g : idx}`));
                            })) })] }) })] }));
}
function MetaCell({ label, value }) {
    return (_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: label }), _jsx("div", { className: "mt-0.5 text-[var(--z-fg)]", children: value })] }));
}

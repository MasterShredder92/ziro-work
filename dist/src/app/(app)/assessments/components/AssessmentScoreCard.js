import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function AssessmentScoreCard({ score }) {
    const tone = score.passed
        ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]"
        : score.manualPendingCount > 0
            ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
            : "border-red-400/40 bg-red-400/10 text-red-300";
    return (_jsxs("div", { className: `rounded-lg border px-4 py-3 min-w-[180px] ${tone}`, children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider font-semibold", children: "Score" }), _jsxs("div", { className: "mt-1 text-2xl font-bold", children: [score.percent, "%"] }), _jsxs("div", { className: "text-[11px] opacity-80", children: [score.totalScore, " / ", score.maxScore || 0, " pts"] }), score.manualPendingCount > 0 ? (_jsxs("div", { className: "mt-1 text-[11px]", children: [score.manualPendingCount, " pending review"] })) : null, score.gradedAt ? (_jsxs("div", { className: "mt-1 text-[10px] opacity-70", children: ["Graded ", new Date(score.gradedAt).toLocaleDateString()] })) : null] }));
}

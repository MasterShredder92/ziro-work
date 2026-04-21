"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { StageHeader } from "@/components/stages/StageHeader";
import { StageStudentList } from "@/components/stages/StageStudentList";
import { loadLifecycleStageSurface } from "./actions";
import { PageTransition } from "@/components/system/PageTransition";
function isRetryableError(message) {
    const normalized = message.toLowerCase();
    return (normalized.includes("timeout") ||
        normalized.includes("temporar") ||
        normalized.includes("network") ||
        normalized.includes("fetch") ||
        normalized.includes("failed to load stage"));
}
function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
function StageSurfaceLoaded({ stageId, tenantId, locationId, }) {
    var _a, _b;
    const [data, setData] = useState(null);
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            const maxAttempts = 3;
            for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
                const res = await loadLifecycleStageSurface(stageId, tenantId, locationId);
                if (cancelled)
                    return;
                if (res.ok) {
                    setErr(null);
                    setData(res.data);
                    setLoading(false);
                    return;
                }
                if (attempt < maxAttempts && isRetryableError(res.error)) {
                    await wait(attempt * 500);
                    continue;
                }
                setErr(res.error);
                setData(null);
                setLoading(false);
                return;
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, [locationId, stageId, tenantId]);
    const nextActions = useMemo(() => {
        if (!data)
            return [];
        return [
            `Work the list for ${data.stageName}.`,
            'If something is marked "Needs attention", fix it first — then move forward.',
        ];
    }, [data]);
    return (_jsx(PageTransition, { children: _jsxs("div", { className: "mx-auto max-w-6xl space-y-[var(--z-space-8)]", children: [loading ? _jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Loading\u2026" }) : null, err ? _jsx("div", { className: "text-sm text-[var(--z-danger)]", children: err }) : null, ((_a = data === null || data === void 0 ? void 0 : data.warnings) === null || _a === void 0 ? void 0 : _a.length) ? (_jsx("div", { className: "rounded-xl border border-[var(--z-warning)]/40 bg-[var(--z-warning)]/10 p-3 text-xs text-[var(--z-warning)]", children: (_b = data.warnings[0]) === null || _b === void 0 ? void 0 : _b.message })) : null, data ? (_jsxs(_Fragment, { children: [_jsx(StageHeader, { stageName: data.stageName, description: data.stageDescription, agentName: data.agentDisplayName }), _jsxs("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] px-[var(--z-space-5)] py-[var(--z-space-4)] space-y-[var(--z-space-3)]", children: [_jsx("p", { className: "text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_22%)]", children: data.agentSummary }), nextActions.length > 0 ? (_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Next steps" }), _jsx("ol", { className: "list-decimal space-y-1 pl-5 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_10%)]", children: nextActions.map((a, i) => (_jsx("li", { children: a }, `${a}-${i}`))) })] })) : null] }), _jsx(StageStudentList, { students: data.students })] })) : null] }) }));
}
export function StageSurfaceClient({ stageId, tenantId, locationId, }) {
    return (_jsx(StageSurfaceLoaded, { stageId: stageId, tenantId: tenantId, locationId: locationId }, `${stageId}-${tenantId}-${locationId !== null && locationId !== void 0 ? locationId : "all"}`));
}

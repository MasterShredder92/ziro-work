import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getRunSurface } from "@/lib/automation/workflows/service";
import { RunTimeline } from "../../components/workflows";
export const dynamic = "force-dynamic";
function formatTs(iso) {
    if (!iso)
        return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return "—";
    return d.toLocaleString();
}
export default async function RunDetailPage({ params, }) {
    let session;
    try {
        session = await requirePermission("automation.read")();
    }
    catch (_a) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: _jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }) }));
    }
    const tenantId = session.tenantId || DEFAULT_TENANT_ID;
    try {
        await assertTenantAccess(tenantId);
    }
    catch (_b) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: _jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }) }));
    }
    const { id } = await params;
    const surface = await getRunSurface(id, tenantId);
    if (!surface)
        notFound();
    await logAudit("automation.run.view", {
        tenantId,
        profileId: session.userId,
        runId: id,
    });
    const { run, workflow, logs } = surface;
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(Link, { href: "/automation/runs", className: "inline-block text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "\u2190 Back to runs" }), _jsxs("header", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Run" }), _jsx("h1", { className: "text-lg font-semibold text-[var(--z-fg)] font-mono", children: run.id }), _jsxs("div", { className: "text-xs text-[var(--z-muted)] mt-1", children: [workflow ? (_jsx(Link, { href: `/automation/workflows/${workflow.id}`, className: "hover:text-[var(--z-fg)]", children: workflow.name })) : (_jsx("span", { children: "Workflow missing" })), " ", "\u00B7 ", run.trigger_type] })] }), _jsxs("div", { className: "text-right text-xs text-[var(--z-muted)]", children: [_jsxs("div", { children: ["Status: ", _jsx("span", { className: "font-semibold text-[var(--z-fg)]", children: run.status })] }), _jsxs("div", { children: ["Attempt: ", run.attempt, "/", run.max_attempts] }), _jsxs("div", { children: ["Started: ", formatTs(run.started_at)] }), _jsxs("div", { children: ["Finished: ", formatTs(run.finished_at)] }), typeof run.duration_ms === "number" ? (_jsxs("div", { children: ["Duration: ", run.duration_ms, "ms"] })) : null] })] }), run.error ? (_jsxs("div", { className: "mt-3 rounded-[var(--z-radius-md)] border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300", children: [run.error.message, run.error.code ? (_jsxs("span", { className: "ml-2 opacity-70", children: ["[", run.error.code, "]"] })) : null] })) : null] }), _jsx(RunTimeline, { run: run, logs: logs })] }));
}

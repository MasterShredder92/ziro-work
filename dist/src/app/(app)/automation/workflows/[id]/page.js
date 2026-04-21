import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { canForRole } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/log";
import { getWorkflowSurface } from "@/lib/automation/workflows/service";
import { RunList, WorkflowEditor } from "../../components/workflows";
export const dynamic = "force-dynamic";
export default async function WorkflowDetailPage({ params, }) {
    var _a;
    let session;
    try {
        session = await requirePermission("automation.read")();
    }
    catch (_b) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: _jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }) }));
    }
    const tenantId = session.tenantId || DEFAULT_TENANT_ID;
    try {
        await assertTenantAccess(tenantId);
    }
    catch (_c) {
        return (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: _jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }) }));
    }
    const { id } = await params;
    const surface = await getWorkflowSurface(id, tenantId);
    if (!surface)
        notFound();
    await logAudit("automation.workflow.view", {
        tenantId,
        profileId: session.userId,
        workflowId: id,
    });
    const canWrite = canForRole(session.role, "automation.write");
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(Link, { href: "/automation/workflows", className: "inline-block text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "\u2190 Back to workflows" }), canWrite ? (_jsx(WorkflowEditor, { mode: "edit", workflow: surface.workflow })) : (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("h1", { className: "text-lg font-semibold text-[var(--z-fg)]", children: surface.workflow.name }), _jsxs("div", { className: "text-xs text-[var(--z-muted)] mt-1", children: [(_a = surface.workflow.trigger) === null || _a === void 0 ? void 0 : _a.type, " \u00B7 ", surface.workflow.actions.length, " ", "action(s)"] })] })), _jsxs("section", { className: "space-y-3", children: [_jsxs("h2", { className: "text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]", children: ["Recent runs (", surface.recentRuns.length, ")"] }), _jsx(RunList, { runs: surface.recentRuns })] })] }));
}

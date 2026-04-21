import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { listRuns } from "@/lib/automation/workflows/queries";
import { RunList } from "../components/workflows";
export const dynamic = "force-dynamic";
export default async function RunsPage({ searchParams, }) {
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
    const sp = (_a = (await (searchParams !== null && searchParams !== void 0 ? searchParams : Promise.resolve({})))) !== null && _a !== void 0 ? _a : {};
    const status = typeof sp.status === "string" ? sp.status : undefined;
    const triggerType = typeof sp.trigger === "string" ? sp.trigger : undefined;
    const workflowId = typeof sp.workflowId === "string" ? sp.workflowId : undefined;
    const runs = await listRuns(tenantId, {
        status: status,
        triggerType,
        workflowId,
    }, { limit: 100 });
    await logAudit("automation.runs.list", {
        tenantId,
        profileId: session.userId,
        count: runs.length,
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("header", { className: "flex flex-wrap items-end justify-between gap-3", children: _jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Automation OS" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Runs" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)] mt-1", children: [runs.length, " recent run", runs.length === 1 ? "" : "s"] })] }) }), _jsxs("form", { action: "/automation/runs", method: "GET", className: "flex flex-wrap items-end gap-2", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-[10px] text-[var(--z-muted)] mb-1", children: "Status" }), _jsxs("select", { name: "status", defaultValue: status !== null && status !== void 0 ? status : "", className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)]", children: [_jsx("option", { value: "", children: "All" }), _jsx("option", { value: "queued", children: "Queued" }), _jsx("option", { value: "running", children: "Running" }), _jsx("option", { value: "succeeded", children: "Succeeded" }), _jsx("option", { value: "failed", children: "Failed" }), _jsx("option", { value: "dead_letter", children: "Dead-letter" }), _jsx("option", { value: "cancelled", children: "Cancelled" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-[10px] text-[var(--z-muted)] mb-1", children: "Trigger type" }), _jsx("input", { name: "trigger", defaultValue: triggerType !== null && triggerType !== void 0 ? triggerType : "", className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)]" })] }), _jsx("button", { type: "submit", className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-2 text-sm text-[var(--z-fg)] hover:bg-white/5", children: "Filter" })] }), _jsx(RunList, { runs: runs, showWorkflow: true })] }));
}

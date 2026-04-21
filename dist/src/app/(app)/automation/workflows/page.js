import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { canForRole } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/log";
import { listWorkflows } from "@/lib/automation/workflows/queries";
import { WorkflowList } from "../components/workflows";
export const dynamic = "force-dynamic";
export default async function WorkflowListPage({ searchParams, }) {
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
    const statusParam = typeof sp.status === "string" ? sp.status : undefined;
    const searchParam = typeof sp.q === "string" ? sp.q : undefined;
    const triggerParam = typeof sp.trigger === "string" ? sp.trigger : undefined;
    const workflows = await listWorkflows(tenantId, {
        status: statusParam,
        search: searchParam,
        triggerType: triggerParam,
    });
    await logAudit("automation.workflows.list", {
        tenantId,
        profileId: session.userId,
        count: workflows.length,
    });
    const canWrite = canForRole(session.role, "automation.write");
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Automation OS" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Workflows" }), _jsxs("div", { className: "text-xs text-[var(--z-muted)] mt-1", children: [workflows.length, " workflow", workflows.length === 1 ? "" : "s", " \u00B7 tenant", " ", _jsx("span", { className: "font-mono", children: tenantId.slice(0, 8) })] })] }), canWrite ? (_jsx(Link, { href: "/automation/workflows/new", className: "rounded-[var(--z-radius-md)] bg-[#00ff88] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#00e679]", children: "New workflow" })) : null] }), _jsxs("form", { action: "/automation/workflows", method: "GET", className: "flex flex-wrap items-end gap-2", children: [_jsxs("div", { className: "flex-1 min-w-[200px]", children: [_jsx("label", { className: "block text-[10px] text-[var(--z-muted)] mb-1", children: "Search" }), _jsx("input", { name: "q", defaultValue: searchParam !== null && searchParam !== void 0 ? searchParam : "", className: "w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)]", placeholder: "Name..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-[10px] text-[var(--z-muted)] mb-1", children: "Status" }), _jsxs("select", { name: "status", defaultValue: statusParam !== null && statusParam !== void 0 ? statusParam : "", className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm text-[var(--z-fg)]", children: [_jsx("option", { value: "", children: "All" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "paused", children: "Paused" }), _jsx("option", { value: "draft", children: "Draft" }), _jsx("option", { value: "archived", children: "Archived" })] })] }), _jsx("button", { type: "submit", className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-2 text-sm text-[var(--z-fg)] hover:bg-white/5", children: "Filter" })] }), _jsx(WorkflowList, { workflows: workflows, canWrite: canWrite })] }));
}

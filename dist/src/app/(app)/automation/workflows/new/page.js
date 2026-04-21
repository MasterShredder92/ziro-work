import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { WorkflowEditor } from "../../components/workflows";
export const dynamic = "force-dynamic";
export default async function NewWorkflowPage() {
    let session;
    try {
        session = await requirePermission("automation.write")();
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
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(Link, { href: "/automation/workflows", className: "inline-block text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]", children: "\u2190 Back to workflows" }), _jsx(WorkflowEditor, { mode: "create" })] }));
}

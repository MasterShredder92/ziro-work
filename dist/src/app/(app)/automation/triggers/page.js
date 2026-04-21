import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { TriggerLibrary } from "../components/workflows";
export const dynamic = "force-dynamic";
export default async function TriggersPage() {
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold", children: "Automation OS" }), _jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-[var(--z-fg)]", children: "Trigger library" }), _jsx("div", { className: "text-xs text-[var(--z-muted)] mt-1", children: "All available trigger types." })] }), _jsx(TriggerLibrary, {})] }));
}

import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { getCRMTenantId } from "./_tenant";
import { CRMNav } from "./_components";
import { CRMKpiSection } from "./_kpi-section";
import { CRMRecentContacts } from "./_recent-contacts";
export async function CRMDashboardBody() {
    const tenantId = await getCRMTenantId();
    return (_jsxs(_Fragment, { children: [_jsx(CRMNav, { current: "home" }), _jsx(CRMKpiSection, { tenantId: tenantId }), _jsx("h2", { className: "mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--z-muted,#909098)]", children: "Recent activity" }), _jsx(CRMRecentContacts, { tenantId: tenantId })] }));
}

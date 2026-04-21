import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { assertTenantAccess, requirePermission, } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getLeadSurface } from "@/lib/leads/service";
import { toLeadDisplayProfile } from "@/lib/leads/types";
import { LeadDetailPanel, LeadQualificationCard, LeadTimeline, } from "../components";
export const dynamic = "force-dynamic";
export default async function LeadSurfacePage({ params, }) {
    var _a;
    let session;
    try {
        session = await requirePermission("leads.read")();
    }
    catch (_b) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "You need the leads.read permission to view this lead." })] }));
    }
    const tenantId = (_a = session.tenantId) !== null && _a !== void 0 ? _a : DEFAULT_TENANT_ID;
    await assertTenantAccess(tenantId);
    const resolved = await params;
    const leadId = resolved.id;
    if (!leadId)
        notFound();
    const surface = await getLeadSurface(leadId, tenantId);
    if (!surface)
        notFound();
    try {
        await assertTenantAccess(surface.detail.lead.tenant_id);
    }
    catch (_c) {
        return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-10 text-center", children: [_jsx("div", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Forbidden" }), _jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "This lead belongs to a different tenant." })] }));
    }
    await logAudit("leads.detail.view", {
        tenantId,
        leadId,
        profileId: session.userId,
        generatedAt: surface.generatedAt,
        source: "page",
    });
    const profile = toLeadDisplayProfile(surface.detail.lead);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("nav", { className: "text-xs text-[var(--z-muted)]", children: [_jsx(Link, { href: "/leads", className: "hover:text-[var(--z-fg)] transition-colors", children: "Leads" }), " ", "/ ", _jsx("span", { className: "text-[var(--z-fg)]", children: profile.fullName })] }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-5", children: [_jsxs("div", { className: "xl:col-span-2 space-y-5", children: [_jsx(LeadDetailPanel, { detail: surface.detail, profile: profile }), _jsx(LeadTimeline, { items: surface.detail.timeline })] }), _jsx("div", { className: "space-y-5", children: _jsx(LeadQualificationCard, { qualification: surface.detail.qualification }) })] })] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { getFamilyById } from "@data/families";
import { getFamilyBillingSummary, listStudentsForFamily } from "@/lib/crm";
import { ensureFamilyAccess } from "../guard";
import { resolveCurrentFamilyId } from "@/lib/family/queries";
export const dynamic = "force-dynamic";
export default async function FamilyPortalProfilePage() {
    var _a, _b, _c, _d;
    const session = await ensureFamilyAccess();
    const familyId = await resolveCurrentFamilyId(session.userId, session.tenantId);
    if (!familyId) {
        return (_jsx("div", { className: "mx-auto flex w-full max-w-4xl flex-col gap-3 p-6", children: _jsxs("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center", children: [_jsx("h1", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "No family profile linked" }), _jsx("p", { className: "mt-2 text-sm text-[var(--z-muted)]", children: "Your account isn't yet connected to a family record. Please contact your studio administrator." })] }) }));
    }
    const [familyRaw, students, billing] = await Promise.all([
        getFamilyById(familyId, session.tenantId),
        listStudentsForFamily(session.tenantId, familyId),
        getFamilyBillingSummary(session.tenantId, familyId).catch(() => null),
    ]);
    const family = (familyRaw !== null && familyRaw !== void 0 ? familyRaw : null);
    if (!family) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "Family record not found." }));
    }
    return (_jsxs("div", { className: "mx-auto flex w-full max-w-5xl flex-col gap-6 p-2", children: [_jsxs("header", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: family.name }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Read-only family profile \u2014 contact your school to update any details." })] }), _jsx(Link, { href: `/messages?familyId=${encodeURIComponent(family.id)}`, className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm font-medium text-[var(--z-fg)] hover:bg-[var(--z-muted)]/10", children: "Message center" })] }), _jsxs("section", { className: "grid gap-4 lg:grid-cols-2", children: [_jsxs(Card, { title: "Primary contact", children: [_jsx(Row, { label: "Contact name", value: (_a = family.primary_contact_name) !== null && _a !== void 0 ? _a : null }), _jsx(Row, { label: "Email", value: (_b = family.primary_email) !== null && _b !== void 0 ? _b : null }), _jsx(Row, { label: "Phone", value: (_c = family.primary_phone) !== null && _c !== void 0 ? _c : null }), _jsx(Row, { label: "Billing status", value: (_d = family.billing_status) !== null && _d !== void 0 ? _d : null })] }), _jsx(Card, { title: "Billing summary", children: billing ? (_jsxs("dl", { className: "space-y-2 text-sm", children: [_jsx(Row, { label: "Status", value: billing.billingStatus }), _jsx(Row, { label: "Balance", value: `$${(billing.balanceCents / 100).toFixed(2)}` }), _jsx(Row, { label: "Overdue", value: `$${(billing.overdueCents / 100).toFixed(2)}` }), _jsx(Row, { label: "Autopay", value: billing.autopayEnabled ? "Enabled" : "Off" })] })) : (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "Billing not available." })) })] }), _jsx(Card, { title: "Students in this family", children: students.length === 0 ? (_jsx("div", { className: "text-sm text-[var(--z-muted)]", children: "No students linked to this family." })) : (_jsx("ul", { className: "divide-y divide-[var(--z-border)] text-sm", children: students.map((s) => {
                        var _a;
                        return (_jsxs("li", { className: "flex items-center justify-between py-2", children: [_jsx("span", { className: "font-semibold text-[var(--z-fg)]", children: s.name }), _jsx("span", { className: "text-[var(--z-muted)]", children: (_a = s.status) !== null && _a !== void 0 ? _a : "—" })] }, s.id));
                    }) })) })] }));
}
function Card({ title, children, }) {
    return (_jsxs("section", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("h3", { className: "mb-3 text-sm font-semibold text-[var(--z-fg)]", children: title }), children] }));
}
function Row({ label, value }) {
    return (_jsxs("div", { className: "flex items-center justify-between border-b border-[var(--z-border)] py-1.5 last:border-0 text-sm", children: [_jsx("dt", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: label }), _jsx("dd", { className: "text-[var(--z-fg)]", children: value !== null && value !== void 0 ? value : "—" })] }));
}

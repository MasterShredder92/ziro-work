import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { listSubscriptions } from "@/lib/billing/subscriptionEngine";
import { listBillingPlans } from "@data/billingPlans";
import { formatCents, formatDate } from "../components/format";
export const dynamic = "force-dynamic";
async function resolveSession() {
    try {
        return await requirePermission("billing.read")();
    }
    catch (_a) {
        redirect("/dashboard");
    }
}
export default async function BillingSubscriptionsPage() {
    const session = await resolveSession();
    const [subs, plans] = await Promise.all([
        listSubscriptions(session.tenantId, undefined, { limit: 500 }),
        listBillingPlans(session.tenantId, { activeOnly: true, limit: 100 }),
    ]);
    const planById = new Map(plans.map((p) => [p.id, p]));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "Subscriptions" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Recurring plans, renewal dates, and student / family assignments." })] }), _jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Plans" }), _jsx("div", { className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3", children: plans.length === 0 ? (_jsx("div", { className: "rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-sm text-[var(--z-muted)]", children: "No active plans \u2014 create one via the API or billing settings." })) : (plans.map((plan) => {
                            var _a;
                            return (_jsxs("div", { className: "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsxs("div", { className: "text-[11px] uppercase tracking-wider text-[var(--z-muted)]", children: [plan.kind, " \u00B7 every ", plan.interval_count, " ", plan.interval] }), _jsx("div", { className: "mt-1 text-lg font-semibold text-[var(--z-fg)]", children: plan.name }), _jsxs("div", { className: "mt-1 text-sm text-[var(--z-muted)]", children: [formatCents(plan.base_price_cents, plan.currency), " base", plan.per_unit_price_cents
                                                ? ` · +${formatCents(plan.per_unit_price_cents, plan.currency)} / ${(_a = plan.unit_label) !== null && _a !== void 0 ? _a : "unit"}`
                                                : ""] }), plan.description ? (_jsx("div", { className: "mt-2 text-sm text-[var(--z-muted)]", children: plan.description })) : null] }, plan.id));
                        })) })] }), _jsxs("section", { className: "space-y-3", children: [_jsx("h2", { className: "text-lg font-semibold text-[var(--z-fg)]", children: "Active subscriptions" }), _jsxs("div", { className: "overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: [_jsx("div", { className: "grid border-b border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-surface),white_2%)]", style: {
                                    gridTemplateColumns: "minmax(160px,1fr) 160px 140px 140px 120px",
                                }, children: ["Plan", "Student / Family", "Status", "Next invoice", "Quantity"].map((c) => (_jsx("div", { className: "px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: c }, c))) }), subs.length === 0 ? (_jsx("div", { className: "px-4 py-10 text-center text-sm text-[var(--z-muted)]", children: "No subscriptions yet." })) : (subs.map((s) => {
                                var _a, _b;
                                return (_jsxs("div", { className: "grid border-b border-[var(--z-border)] last:border-b-0 hover:bg-white/[0.02]", style: {
                                        gridTemplateColumns: "minmax(160px,1fr) 160px 140px 140px 120px",
                                    }, children: [_jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-fg)]", children: s.billing_plan_id
                                                ? ((_b = (_a = planById.get(s.billing_plan_id)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "Plan")
                                                : "—" }), _jsxs("div", { className: "px-4 py-3 text-sm text-[var(--z-muted)]", children: [s.student_id ? `Student: ${s.student_id.slice(0, 8)}` : null, s.family_id ? ` Family: ${s.family_id.slice(0, 8)}` : null] }), _jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-fg)] uppercase", children: s.status }), _jsx("div", { className: "px-4 py-3 text-sm text-[var(--z-muted)]", children: formatDate(s.next_invoice_at) }), _jsx("div", { className: "px-4 py-3 text-sm tabular-nums text-[var(--z-muted)]", children: s.quantity })] }, s.id));
                            }))] })] })] }));
}

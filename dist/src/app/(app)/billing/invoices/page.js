import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { listInvoices } from "@/lib/billing/invoiceQueries";
import { InvoiceList } from "../components/InvoiceList";
export const dynamic = "force-dynamic";
async function resolveSession() {
    try {
        return await requirePermission("billing.read")();
    }
    catch (_a) {
        redirect("/dashboard");
    }
}
export default async function BillingInvoicesPage() {
    const session = await resolveSession();
    const invoices = await listInvoices(session.tenantId, undefined, {
        limit: 500,
        orderBy: "created_at",
        ascending: false,
    });
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "Invoices" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Filter, search, and manage invoices." })] }), _jsx(InvoiceList, { invoices: invoices, tenantId: session.tenantId })] }));
}

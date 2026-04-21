import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { NewInvoiceForm } from "./_form";
export const dynamic = "force-dynamic";
async function resolveSession() {
    try {
        return await requirePermission("billing.write")();
    }
    catch (_a) {
        redirect("/billing/invoices");
    }
}
export default async function NewInvoicePage() {
    const session = await resolveSession();
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "New invoice" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Draft a new invoice. You can add line items now or later." })] }), _jsx(NewInvoiceForm, { tenantId: session.tenantId })] }));
}

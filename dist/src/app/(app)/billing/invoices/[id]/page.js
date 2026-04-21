import { jsx as _jsx } from "react/jsx-runtime";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { getInvoice } from "@/lib/billing/invoiceQueries";
import { InvoiceDetail } from "../../components/InvoiceDetail";
export const dynamic = "force-dynamic";
async function resolveSession() {
    try {
        return await requirePermission("billing.read")();
    }
    catch (_a) {
        redirect("/dashboard");
    }
}
export default async function BillingInvoiceDetailPage({ params }) {
    const session = await resolveSession();
    const { id } = await params;
    const invoice = await getInvoice(session.tenantId, id);
    if (!invoice)
        notFound();
    return _jsx(InvoiceDetail, { invoice: invoice, tenantId: session.tenantId });
}

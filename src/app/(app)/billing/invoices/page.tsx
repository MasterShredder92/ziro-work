import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { listInvoices } from "@/lib/billing/invoiceQueries";
import { InvoiceList } from "../components/InvoiceList";

export const dynamic = "force-dynamic";

async function resolveSession(): Promise<Session> {
  try {
    return await requirePermission("billing.read")();
  } catch {
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

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">Invoices</h1>
        <p className="text-sm text-[var(--z-muted)]">
          Filter, search, and manage invoices.
        </p>
      </header>
      <InvoiceList invoices={invoices} tenantId={session.tenantId} />
    </div>
  );
}

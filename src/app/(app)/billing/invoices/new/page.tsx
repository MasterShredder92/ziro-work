import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { NewInvoiceForm } from "./_form";

export const dynamic = "force-dynamic";

async function resolveSession(): Promise<Session> {
  try {
    return await requirePermission("billing.write")();
  } catch {
    redirect("/billing/invoices");
  }
}

export default async function NewInvoicePage() {
  const session = await resolveSession();
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">New invoice</h1>
        <p className="text-sm text-[var(--z-muted)]">
          Draft a new invoice. You can add line items now or later.
        </p>
      </header>
      <NewInvoiceForm tenantId={session.tenantId} />
    </div>
  );
}

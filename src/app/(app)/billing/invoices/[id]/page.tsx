import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { getInvoice } from "@/lib/billing/invoiceQueries";
import { InvoiceDetail } from "../../components/InvoiceDetail";

export const dynamic = "force-dynamic";

async function resolveSession(): Promise<Session> {
  try {
    return await requirePermission("billing.read")();
  } catch {
    redirect("/dashboard");
  }
}

type Props = { params: Promise<{ id: string }> };

export default async function BillingInvoiceDetailPage({ params }: Props) {
  const session = await resolveSession();
  const { id } = await params;
  const invoice = await getInvoice(session.tenantId, id);
  if (!invoice) notFound();

  return <InvoiceDetail invoice={invoice} tenantId={session.tenantId} />;
}

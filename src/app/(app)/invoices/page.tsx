import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const InvoicesClient = dynamic(() => import("./_client").then((m) => m.InvoicesClient), {
  loading: () => <PageShell title="Invoices" />,
});

export default function InvoicesPage() {
  return <InvoicesClient />;
}


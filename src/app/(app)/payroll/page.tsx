import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const PayrollClient = dynamic(() => import("./_client").then((m) => m.PayrollClient), {
  loading: () => <PageShell title="Payroll" />,
});

export default function PayrollPage() {
  return <PayrollClient />;
}


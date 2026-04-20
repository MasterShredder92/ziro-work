import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

// ssr:false prevents React hydration error #418 — PayrollClient uses new Date() for
// month ranges which produces different output on server vs client (timezone differences)
const PayrollClient = dynamic(() => import("./_client").then((m) => m.PayrollClient), {
  ssr: false,
  loading: () => <PageShell title="Payroll" />,
});

export default function PayrollPage() {
  return <PayrollClient />;
}


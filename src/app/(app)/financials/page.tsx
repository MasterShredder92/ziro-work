import dynamicImport from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const FinancialsClient = dynamicImport(() => import("./_client").then((m) => m.FinancialsClient), {
  loading: () => <PageShell title="Financials" />,
});

export const dynamic = "force-dynamic";

export default function FinancialsPage() {
  return <FinancialsClient />;
}

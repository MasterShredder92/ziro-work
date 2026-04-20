import dynamicImport from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

// ssr:false prevents React hydration error — FinancialsClient uses new Date() for initial state
const FinancialsClient = dynamicImport(() => import("./_client").then((m) => m.FinancialsClient), {
  ssr: false,
  loading: () => <PageShell title="Financials" />,
});

export const dynamic = "force-dynamic";

export default function FinancialsPage() {
  return <FinancialsClient />;
}

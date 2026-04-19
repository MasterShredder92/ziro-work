import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const BillingSettingsClient = dynamic(() => import("./_client").then((m) => m.BillingSettingsClient), {
  loading: () => <PageShell title="Billing" />,
});

export default function BillingSettingsPage() {
  return <BillingSettingsClient />;
}

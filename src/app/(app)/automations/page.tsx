import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const AutomationsClient = dynamic(() => import("./_client").then((m) => m.AutomationsClient), {
  loading: () => <PageShell />,
});

export default function AutomationsPage() {
  return <AutomationsClient />;
}

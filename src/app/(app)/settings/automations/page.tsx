import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const AutomationsSettingsClient = dynamic(() => import("./_client").then((m) => m.AutomationsSettingsClient), {
  loading: () => <PageShell title="Automations" />,
});

export default function AutomationsSettingsPage() {
  return <AutomationsSettingsClient />;
}

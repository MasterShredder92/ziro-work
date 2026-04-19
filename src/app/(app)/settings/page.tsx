import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const SettingsClient = dynamic(() => import("./_client").then((m) => m.SettingsClient), {
  loading: () => <PageShell title="Settings" />,
});

export default function SettingsPage() {
  return <SettingsClient />;
}


import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const StudioInfoSettingsClient = dynamic(() => import("./_client").then((m) => m.StudioInfoSettingsClient), {
  loading: () => <PageShell title="Studio Info" />,
});

export default function StudioInfoSettingsPage() {
  return <StudioInfoSettingsClient />;
}

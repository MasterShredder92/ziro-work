import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const TeachersSettingsClient = dynamic(() => import("./_client").then((m) => m.TeachersSettingsClient), {
  loading: () => <PageShell title="Teachers" />,
});

export default function TeachersSettingsPage() {
  return <TeachersSettingsClient />;
}

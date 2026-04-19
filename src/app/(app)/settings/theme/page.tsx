import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const ThemeSettingsClient = dynamic(() => import("./_client").then((m) => m.ThemeSettingsClient), {
  loading: () => <PageShell title="Theme" />,
});

export default function ThemeSettingsPage() {
  return <ThemeSettingsClient />;
}

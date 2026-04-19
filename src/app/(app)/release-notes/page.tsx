import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const ReleaseNotesClient = dynamic(() => import("./_client").then((m) => m.ReleaseNotesClient), {
  loading: () => <PageShell />,
});

export default function ReleaseNotesPage() {
  return <ReleaseNotesClient />;
}

import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const ReleaseNotesAdminClient = dynamic(() => import("./_client").then((m) => m.ReleaseNotesAdminClient), {
  loading: () => <PageShell title="Release notes" />,
});

export default function ReleaseNotesAdminPage() {
  return <ReleaseNotesAdminClient />;
}

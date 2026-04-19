import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const AnnouncementsClient = dynamic(() => import("./_client").then((m) => m.AnnouncementsClient), {
  loading: () => <PageShell />,
});

export default function AnnouncementsPage() {
  return <AnnouncementsClient />;
}

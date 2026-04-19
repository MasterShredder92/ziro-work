import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const TeachersClient = dynamic(() => import("./_client").then((m) => m.TeachersClient), {
  loading: () => <PageShell title="Teachers" />,
});

export default function TeachersPage() {
  return <TeachersClient />;
}


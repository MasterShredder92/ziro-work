import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const StudentDetailClient = dynamic(() => import("./_client").then((m) => m.StudentDetailClient), {
  loading: () => <PageShell title="Student" />,
});

export default function StudentDetailPage() {
  return <StudentDetailClient />;
}

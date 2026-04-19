import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const TeacherDetailClient = dynamic(() => import("./_client").then((m) => m.TeacherDetailClient), {
  loading: () => <PageShell title="Teacher" />,
});

export default function TeacherDetailPage() {
  return <TeacherDetailClient />;
}

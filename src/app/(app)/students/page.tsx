import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const StudentsClient = dynamic(() => import("./_client").then((m) => m.StudentsClient), {
  loading: () => <PageShell title="Students" />,
});

export default function StudentsPage() {
  return <StudentsClient />;
}


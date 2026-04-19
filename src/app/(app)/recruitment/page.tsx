import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const RecruitmentClient = dynamic(() => import("./_client").then((m) => m.RecruitmentClient), {
  loading: () => <PageShell title="Recruitment" />,
});

export default function RecruitmentPage() {
  return <RecruitmentClient />;
}


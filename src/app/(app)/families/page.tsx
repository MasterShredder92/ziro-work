import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const FamiliesClient = dynamic(() => import("./_client").then((m) => m.FamiliesClient), {
  loading: () => <PageShell title="Families / Accounts" />,
});

export default function FamiliesPage() {
  return <FamiliesClient />;
}


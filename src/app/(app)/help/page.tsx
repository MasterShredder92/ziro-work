import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const HelpClient = dynamic(() => import("./_client").then((m) => m.HelpClient), {
  loading: () => <PageShell title="Help" />,
});

export default function HelpPage() {
  return <HelpClient />;
}

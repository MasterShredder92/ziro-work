import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const EmailTemplatesClient = dynamic(() => import("./_client").then((m) => m.EmailTemplatesClient), {
  loading: () => <PageShell />,
});

export default function EmailTemplatesPage() {
  return <EmailTemplatesClient />;
}

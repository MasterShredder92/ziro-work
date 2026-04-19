import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";

const EmailPreviewClient = dynamic(() => import("./_client").then((m) => m.EmailPreviewClient), {
  loading: () => <PageShell />,
});

export default function EmailPreviewPage() {
  return <EmailPreviewClient />;
}

import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const EmailPreviewClient = dynamic(() => import("./_client").then((m) => m.EmailPreviewClient), {
    loading: () => _jsx(PageShell, {}),
});
export default function EmailPreviewPage() {
    return _jsx(EmailPreviewClient, {});
}

import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const EmailTemplatesClient = dynamic(() => import("./_client").then((m) => m.EmailTemplatesClient), {
    loading: () => _jsx(PageShell, {}),
});
export default function EmailTemplatesPage() {
    return _jsx(EmailTemplatesClient, {});
}

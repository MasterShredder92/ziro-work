import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const ReleaseNotesClient = dynamic(() => import("./_client").then((m) => m.ReleaseNotesClient), {
    loading: () => _jsx(PageShell, {}),
});
export default function ReleaseNotesPage() {
    return _jsx(ReleaseNotesClient, {});
}

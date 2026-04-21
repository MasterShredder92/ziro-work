import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const ReleaseNotesAdminClient = dynamic(() => import("./_client").then((m) => m.ReleaseNotesAdminClient), {
    loading: () => _jsx(PageShell, { title: "Release notes" }),
});
export default function ReleaseNotesAdminPage() {
    return _jsx(ReleaseNotesAdminClient, {});
}

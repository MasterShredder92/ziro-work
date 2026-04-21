import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const AnnouncementsClient = dynamic(() => import("./_client").then((m) => m.AnnouncementsClient), {
    loading: () => _jsx(PageShell, {}),
});
export default function AnnouncementsPage() {
    return _jsx(AnnouncementsClient, {});
}

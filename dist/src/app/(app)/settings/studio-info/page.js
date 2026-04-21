import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const StudioInfoSettingsClient = dynamic(() => import("./_client").then((m) => m.StudioInfoSettingsClient), {
    loading: () => _jsx(PageShell, { title: "Studio Info" }),
});
export default function StudioInfoSettingsPage() {
    return _jsx(StudioInfoSettingsClient, {});
}

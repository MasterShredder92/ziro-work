import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const SettingsClient = dynamic(() => import("./_client").then((m) => m.SettingsClient), {
    loading: () => _jsx(PageShell, { title: "Settings" }),
});
export default function SettingsPage() {
    return _jsx(SettingsClient, {});
}

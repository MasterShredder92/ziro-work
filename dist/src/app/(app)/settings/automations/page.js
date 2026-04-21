import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const AutomationsSettingsClient = dynamic(() => import("./_client").then((m) => m.AutomationsSettingsClient), {
    loading: () => _jsx(PageShell, { title: "Automations" }),
});
export default function AutomationsSettingsPage() {
    return _jsx(AutomationsSettingsClient, {});
}

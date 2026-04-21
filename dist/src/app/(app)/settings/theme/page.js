import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const ThemeSettingsClient = dynamic(() => import("./_client").then((m) => m.ThemeSettingsClient), {
    loading: () => _jsx(PageShell, { title: "Theme" }),
});
export default function ThemeSettingsPage() {
    return _jsx(ThemeSettingsClient, {});
}

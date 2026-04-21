import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const PermissionsSettingsClient = dynamic(() => import("./_client").then((m) => m.PermissionsSettingsClient), {
    loading: () => _jsx(PageShell, { title: "Permissions" }),
});
export default function PermissionsSettingsPage() {
    return _jsx(PermissionsSettingsClient, {});
}

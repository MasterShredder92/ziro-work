import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const TeachersSettingsClient = dynamic(() => import("./_client").then((m) => m.TeachersSettingsClient), {
    loading: () => _jsx(PageShell, { title: "Teachers" }),
});
export default function TeachersSettingsPage() {
    return _jsx(TeachersSettingsClient, {});
}

import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const AutomationsClient = dynamic(() => import("./_client").then((m) => m.AutomationsClient), {
    loading: () => _jsx(PageShell, {}),
});
export default function AutomationsPage() {
    return _jsx(AutomationsClient, {});
}

import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const BillingSettingsClient = dynamic(() => import("./_client").then((m) => m.BillingSettingsClient), {
    loading: () => _jsx(PageShell, { title: "Billing" }),
});
export default function BillingSettingsPage() {
    return _jsx(BillingSettingsClient, {});
}

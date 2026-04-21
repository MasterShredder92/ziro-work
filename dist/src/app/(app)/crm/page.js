import { jsx as _jsx } from "react/jsx-runtime";
import dynamicImport from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const CRMHubClient = dynamicImport(() => import("./_hub-client").then((m) => m.CRMHubClient), {
    loading: () => _jsx(PageShell, { title: "Families & Students" }),
});
export const dynamic = "force-dynamic";
export default function CRMPage() {
    return _jsx(CRMHubClient, {});
}

import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const FamiliesClient = dynamic(() => import("./_client").then((m) => m.FamiliesClient), {
    loading: () => _jsx(PageShell, { title: "Families / Accounts" }),
});
export default function FamiliesPage() {
    return _jsx(FamiliesClient, {});
}

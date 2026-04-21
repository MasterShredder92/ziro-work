import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const HelpClient = dynamic(() => import("./_client").then((m) => m.HelpClient), {
    loading: () => _jsx(PageShell, { title: "Help" }),
});
export default function HelpPage() {
    return _jsx(HelpClient, {});
}

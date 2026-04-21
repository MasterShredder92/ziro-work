import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const RecruitmentClient = dynamic(() => import("./_client").then((m) => m.RecruitmentClient), {
    loading: () => _jsx(PageShell, { title: "Recruitment" }),
});
export default function RecruitmentPage() {
    return _jsx(RecruitmentClient, {});
}

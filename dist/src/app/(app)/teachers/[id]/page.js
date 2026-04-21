import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const TeacherDetailClient = dynamic(() => import("./_client").then((m) => m.TeacherDetailClient), {
    loading: () => _jsx(PageShell, { title: "Teacher" }),
});
export default function TeacherDetailPage() {
    return _jsx(TeacherDetailClient, {});
}

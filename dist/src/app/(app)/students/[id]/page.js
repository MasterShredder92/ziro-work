import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
import { PageShell } from "@/components/layouts/PageShell";
const StudentDetailClient = dynamic(() => import("./_client").then((m) => m.StudentDetailClient), {
    loading: () => _jsx(PageShell, { title: "Student" }),
});
export default function StudentDetailPage() {
    return _jsx(StudentDetailClient, {});
}

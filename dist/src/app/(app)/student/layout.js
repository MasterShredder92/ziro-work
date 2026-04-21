import { jsx as _jsx } from "react/jsx-runtime";
import { getSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { toStudentDisplayProfile } from "@/lib/student/types";
import { resolveStudentContext } from "./guard";
import { STUDENT_NAV_ITEMS, StudentShell } from "./components";
export const dynamic = "force-dynamic";
export default async function StudentLayout({ children, }) {
    let profile = null;
    try {
        const ctx = await resolveStudentContext();
        profile = toStudentDisplayProfile(ctx.student);
    }
    catch (_a) {
        profile = null;
    }
    const session = await getSession();
    const allowedNavIds = session
        ? STUDENT_NAV_ITEMS.filter((item) => !item.scope || can(session.role, item.scope)).map((item) => item.id)
        : STUDENT_NAV_ITEMS.map((item) => item.id);
    return (_jsx(StudentShell, { profile: profile, allowedNavIds: allowedNavIds, children: children }));
}

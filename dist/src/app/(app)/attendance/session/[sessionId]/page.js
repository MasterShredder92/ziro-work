import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import { logAudit } from "@/lib/audit/log";
import { getSessionWithRoster } from "@/lib/attendance/service";
import { resolveAttendancePageContext } from "../../guard";
import { SessionRosterGrid } from "../../components";
export const dynamic = "force-dynamic";
export default async function SessionAttendancePage({ params, }) {
    var _a, _b, _c, _d, _e;
    const { sessionId } = await params;
    let ctx;
    try {
        ctx = await resolveAttendancePageContext();
    }
    catch (_f) {
        return (_jsx("div", { className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "You don't have access to this session." }));
    }
    const data = await getSessionWithRoster(sessionId, ctx.tenantId);
    if (!data)
        notFound();
    await logAudit("attendance.session.view", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        role: ctx.session.role,
        sessionId,
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "space-y-1", children: [_jsxs("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: ["Session \u00B7 ", data.session_date] }), _jsxs("p", { className: "text-sm text-[var(--z-muted)]", children: [(_b = (_a = data.start_time) === null || _a === void 0 ? void 0 : _a.slice(0, 5)) !== null && _b !== void 0 ? _b : "—", " \u2013", " ", (_d = (_c = data.end_time) === null || _c === void 0 ? void 0 : _c.slice(0, 5)) !== null && _d !== void 0 ? _d : "—", " \u00B7 status ", data.status, data.class_label ? ` · ${data.class_label}` : ""] })] }), _jsx(SessionRosterGrid, { session: data, markedBy: (_e = ctx.session.userId) !== null && _e !== void 0 ? _e : null })] }));
}

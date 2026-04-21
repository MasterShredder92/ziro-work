import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const STATUS_COLOR = {
    present: "#22c55e",
    tardy: "#facc15",
    absent: "#ef4444",
    no_show: "#f97316",
    excused: "#a78bfa",
    makeup: "#06b6d4",
};
export function AttendanceRecordTable({ records, sessions, }) {
    const sessionsById = new Map(sessions.map((s) => [s.id, s]));
    if (records.length === 0) {
        return (_jsx("div", { className: "rounded-lg border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "No attendance records in this window." }));
    }
    const rows = [...records].sort((a, b) => {
        var _a, _b, _c, _d;
        const da = (_b = (_a = sessionsById.get(a.session_id)) === null || _a === void 0 ? void 0 : _a.session_date) !== null && _b !== void 0 ? _b : a.created_at;
        const db = (_d = (_c = sessionsById.get(b.session_id)) === null || _c === void 0 ? void 0 : _c.session_date) !== null && _d !== void 0 ? _d : b.created_at;
        if (da !== db)
            return db.localeCompare(da);
        return b.created_at.localeCompare(a.created_at);
    });
    return (_jsx("div", { className: "overflow-x-auto rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "min-w-full text-sm", children: [_jsx("thead", { className: "bg-[color-mix(in_oklab,var(--z-surface-2),transparent_10%)]", children: _jsxs("tr", { className: "text-left text-[10px] uppercase tracking-wider text-[var(--z-muted)]", children: [_jsx("th", { className: "px-4 py-2", children: "Date" }), _jsx("th", { className: "px-4 py-2", children: "Status" }), _jsx("th", { className: "px-4 py-2", children: "Late" }), _jsx("th", { className: "px-4 py-2", children: "Reason" }), _jsx("th", { className: "px-4 py-2", children: "Override" })] }) }), _jsx("tbody", { children: rows.map((r) => {
                        var _a, _b, _c, _d, _e;
                        const session = sessionsById.get(r.session_id);
                        return (_jsxs("tr", { className: "border-t border-[var(--z-border)]", children: [_jsx("td", { className: "px-4 py-2 text-[var(--z-fg)]", children: (_a = session === null || session === void 0 ? void 0 : session.session_date) !== null && _a !== void 0 ? _a : r.created_at.slice(0, 10) }), _jsx("td", { className: "px-4 py-2", children: _jsx("span", { className: "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider", style: {
                                            color: (_b = STATUS_COLOR[r.status]) !== null && _b !== void 0 ? _b : "#94a3b8",
                                            backgroundColor: "rgba(255,255,255,0.05)",
                                        }, children: r.status }) }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: r.minutes_late ? `${r.minutes_late}m` : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)]", children: (_d = (_c = r.reason_text) !== null && _c !== void 0 ? _c : r.reason_id) !== null && _d !== void 0 ? _d : "—" }), _jsx("td", { className: "px-4 py-2 text-[var(--z-muted)] text-xs", children: r.override_of ? `→ ${(_e = r.override_reason) !== null && _e !== void 0 ? _e : "overridden"}` : "—" })] }, r.id));
                    }) })] }) }));
}

"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
// ─── Location color palette ───────────────────────────────────────────────────
const LOCATION_COLORS = {
    "f7b52dd5-12ee-437f-9c60-f8adf454ac31": { color: "#7C3AED", glow: "rgba(124,58,237,0.35)" },
    "40c67ffc-91b5-46a9-94bd-6ddffdfb7638": { color: "#16A34A", glow: "rgba(22,163,74,0.35)" },
    "cebd97d4-c241-4de2-8ade-49e5cc0070d5": { color: "#0EA5E9", glow: "rgba(14,165,233,0.35)" },
    "d48229c1-b70a-4d29-893e-5079887dab76": { color: "#DC2626", glow: "rgba(220,38,38,0.35)" },
};
const DEFAULT_LOC_COLOR = { color: "#6366f1", glow: "rgba(99,102,241,0.35)" };
function getLocColor(id) {
    var _a;
    return (_a = LOCATION_COLORS[id]) !== null && _a !== void 0 ? _a : DEFAULT_LOC_COLOR;
}
function teacherDisplayName(t) {
    var _a, _b;
    const first = ((_a = t.first_name) !== null && _a !== void 0 ? _a : "").trim();
    const last = ((_b = t.last_name) !== null && _b !== void 0 ? _b : "").trim();
    return `${first} ${last}`.trim() || "Teacher";
}
function initials(name) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => { var _a; return (_a = p[0]) === null || _a === void 0 ? void 0 : _a.toUpperCase(); })
        .join("") || "?";
}
// ─── Student chip ─────────────────────────────────────────────────────────────
function StudentChip({ student }) {
    const active = student.status === "active";
    return (_jsxs(Link, { href: `/students/${student.id}`, className: "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all hover:-translate-y-0.5", style: {
            borderColor: active ? "rgba(52,211,153,0.4)" : "var(--z-border)",
            background: active ? "rgba(52,211,153,0.06)" : "var(--z-surface-2)",
            opacity: active ? 1 : 0.6,
        }, children: [_jsx("span", { className: "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", style: {
                    background: active ? "rgba(52,211,153,0.18)" : "var(--z-surface)",
                    color: active ? "#34d399" : "var(--z-muted)",
                }, children: initials(student.name) }), _jsx("span", { className: "truncate font-medium text-[var(--z-fg)]", children: student.name }), !active && (_jsx("span", { className: "ml-auto shrink-0 rounded-full bg-[var(--z-surface)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--z-muted)]", children: student.status }))] }));
}
// ─── Teacher card (inside expanded location) ──────────────────────────────────
function TeacherCard({ teacher, locationId, scheduleWindow, }) {
    var _a, _b;
    const [expanded, setExpanded] = React.useState(false);
    const [students, setStudents] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const name = teacherDisplayName(teacher);
    const handleToggle = async () => {
        var _a;
        if (!expanded && students === null) {
            setLoading(true);
            try {
                const res = await fetch(`/api/studio-map/roster?teacherId=${encodeURIComponent(teacher.id)}&locationId=${encodeURIComponent(locationId)}&start=${scheduleWindow.start}&end=${scheduleWindow.end}`);
                if (res.ok) {
                    const data = await res.json();
                    setStudents((_a = data.students) !== null && _a !== void 0 ? _a : []);
                }
                else {
                    setStudents([]);
                }
            }
            catch (_b) {
                setStudents([]);
            }
            finally {
                setLoading(false);
            }
        }
        setExpanded((prev) => !prev);
    };
    const instruments = (_b = (_a = teacher.instruments) === null || _a === void 0 ? void 0 : _a.join(", ")) !== null && _b !== void 0 ? _b : "";
    return (_jsxs("div", { className: "rounded-xl border overflow-hidden", style: { borderColor: "var(--z-border)" }, children: [_jsxs("button", { onClick: handleToggle, className: "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]", style: { background: "var(--z-surface)" }, children: [_jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold", style: {
                            borderColor: "var(--z-border)",
                            background: "var(--z-surface-2)",
                            color: "var(--z-accent)",
                        }, children: initials(name) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "truncate text-sm font-bold text-[var(--z-fg)]", children: name }), instruments && (_jsx("div", { className: "truncate text-[11px] text-[var(--z-muted)]", children: instruments }))] }), _jsx("svg", { className: `h-3 w-3 shrink-0 transition-transform text-[var(--z-muted)] ${expanded ? "rotate-90" : ""}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 3, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) })] }), expanded && (_jsx("div", { className: "border-t px-4 py-3", style: { borderColor: "var(--z-border)", background: "var(--z-surface-2)" }, children: loading ? (_jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "Loading roster\u2026" })) : students === null || students.length === 0 ? (_jsx("p", { className: "text-xs text-[var(--z-muted)]", children: "No students on this roster." })) : (_jsx("div", { className: "space-y-1.5", children: students.map((s) => (_jsx(StudentChip, { student: s }, s.id))) })) }))] }));
}
// ─── Expanded location view ───────────────────────────────────────────────────
function LocationExpanded({ locationId, locationName, bundle, loading, scheduleWindow, onBack, }) {
    const { color, glow } = getLocColor(locationId);
    return (_jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-300", children: [_jsxs("div", { className: "mb-5 flex items-center gap-3", children: [_jsx("button", { onClick: onBack, className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[var(--z-muted)] transition-colors hover:text-[var(--z-fg)]", style: { borderColor: "var(--z-border)", background: "var(--z-surface)" }, "aria-label": "Back to overview", children: "\u2190" }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "inline-block h-3 w-3 rounded-full", style: { background: color, boxShadow: `0 0 8px ${glow}` } }), _jsx("h2", { className: "text-xl font-bold", style: { color }, children: locationName })] }), bundle && (_jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: [bundle.stats.teacherCount, " teacher", bundle.stats.teacherCount !== 1 ? "s" : "", " \u00B7", " ", bundle.stats.roomCount, " room", bundle.stats.roomCount !== 1 ? "s" : "", " \u00B7", " ", bundle.stats.openSlotCount, " open slot", bundle.stats.openSlotCount !== 1 ? "s" : ""] }))] }), _jsx(Link, { href: `/schedule?locationId=${locationId}`, className: "ml-auto rounded-full px-3 py-1.5 text-xs font-bold transition-colors", style: {
                            background: `${color}22`,
                            color,
                            border: `1px solid ${color}44`,
                        }, children: "View schedule \u2192" })] }), loading ? (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-14 animate-pulse rounded-xl", style: { background: "var(--z-surface)" } }, i))) })) : !bundle || bundle.teachers.length === 0 ? (_jsx("div", { className: "rounded-xl border border-[var(--z-border)] px-6 py-10 text-center text-sm text-[var(--z-muted)]", children: "No teachers at this location." })) : (_jsx("div", { className: "space-y-2", children: bundle.teachers.map((teacher) => (_jsx(TeacherCard, { teacher: teacher, locationId: locationId, scheduleWindow: scheduleWindow }, teacher.id))) }))] }));
}
// ─── Location overview card ───────────────────────────────────────────────────
function LocationCard({ location, isGreyedOut, onClick, }) {
    const { color, glow } = getLocColor(location.id);
    return (_jsxs("button", { onClick: onClick, className: "group relative flex w-full flex-col items-start gap-3 overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300", style: {
            borderColor: isGreyedOut ? "var(--z-border)" : `${color}55`,
            background: isGreyedOut
                ? "var(--z-surface)"
                : `linear-gradient(135deg, color-mix(in oklab, var(--z-surface), transparent 5%) 0%, color-mix(in oklab, var(--z-surface-2), transparent 30%) 100%)`,
            boxShadow: isGreyedOut ? "none" : `0 0 0 1px ${color}22, 0 8px 32px ${glow}`,
            opacity: isGreyedOut ? 0.4 : 1,
            transform: isGreyedOut ? "scale(0.97)" : "scale(1)",
        }, children: [!isGreyedOut && (_jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-30", style: { background: color } })), _jsxs("div", { className: "relative flex items-center gap-2", children: [_jsx("span", { className: "inline-block h-3 w-3 rounded-full transition-all duration-300", style: {
                            background: color,
                            boxShadow: isGreyedOut ? "none" : `0 0 8px ${glow}`,
                        } }), _jsx("span", { className: "text-base font-bold transition-colors duration-300", style: { color: isGreyedOut ? "var(--z-muted)" : color }, children: location.name })] }), !isGreyedOut && (_jsx("div", { className: "relative text-[11px] font-semibold text-[var(--z-muted)] transition-colors group-hover:text-[var(--z-fg)]", children: "Click to explore \u2192" }))] }));
}
// ─── Overview: all 4 location cards ──────────────────────────────────────────
function LocationOverview({ companyName, locations, onSelectLocation, }) {
    return (_jsxs("div", { className: "animate-in fade-in duration-300", children: [_jsxs("div", { className: "mb-6 flex flex-col items-center gap-1 text-center", children: [_jsx("div", { className: "mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 text-lg font-black", style: {
                            borderColor: "rgba(245,158,11,0.5)",
                            background: "radial-gradient(circle at 38% 32%, rgba(245,158,11,0.15) 0%, var(--z-surface-2) 70%)",
                            boxShadow: "0 0 24px rgba(245,158,11,0.25)",
                            color: "#f59e0b",
                        }, children: initials(companyName) }), _jsx("h2", { className: "text-lg font-bold text-[var(--z-fg)]", children: companyName }), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: [locations.length, " location", locations.length !== 1 ? "s" : "", " \u2014 click one to explore"] })] }), _jsx("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2", children: locations.map((loc) => (_jsx(LocationCard, { location: loc, isGreyedOut: false, onClick: () => onSelectLocation(loc.id) }, loc.id))) })] }));
}
export function StudioMapZoom({ companyName, locations, scheduleWindow, initialFocusLocationId, }) {
    var _a;
    const [focusedId, setFocusedId] = React.useState(initialFocusLocationId);
    const [bundles, setBundles] = React.useState({});
    const [loadingId, setLoadingId] = React.useState(null);
    // Fetch location bundle when a location is selected
    const handleSelectLocation = React.useCallback(async (locationId) => {
        setFocusedId(locationId);
        if (bundles[locationId])
            return; // already fetched
        setLoadingId(locationId);
        try {
            const res = await fetch(`/api/studio-map/location?locationId=${encodeURIComponent(locationId)}&start=${scheduleWindow.start}&end=${scheduleWindow.end}`);
            if (res.ok) {
                const data = await res.json();
                setBundles((prev) => (Object.assign(Object.assign({}, prev), { [locationId]: data })));
            }
        }
        catch (_a) {
            // silently fail — show empty state
        }
        finally {
            setLoadingId(null);
        }
    }, [bundles, scheduleWindow]);
    // Auto-fetch initial focus location
    React.useEffect(() => {
        if (initialFocusLocationId && !bundles[initialFocusLocationId]) {
            handleSelectLocation(initialFocusLocationId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const focusedLocation = focusedId ? locations.find((l) => l.id === focusedId) : null;
    if (focusedId && focusedLocation) {
        return (_jsx(LocationExpanded, { locationId: focusedId, locationName: focusedLocation.name, bundle: (_a = bundles[focusedId]) !== null && _a !== void 0 ? _a : null, loading: loadingId === focusedId, scheduleWindow: scheduleWindow, onBack: () => setFocusedId(null) }));
    }
    return (_jsx(LocationOverview, { companyName: companyName, locations: locations, onSelectLocation: handleSelectLocation }));
}

"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import dynamic from "next/dynamic";
const SchedulingShell = dynamic(() => import("./SchedulingShell").then((m) => ({ default: m.SchedulingShell })), {
    ssr: false,
    loading: () => (_jsx("div", { className: "flex h-64 items-center justify-center text-[var(--z-muted)] text-sm", children: "Loading schedule\u2026" })),
});
export function SchedulingShellWrapper({ initialSchedules }) {
    return _jsx(SchedulingShell, { initialSchedules: initialSchedules });
}

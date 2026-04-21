"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { StudioMapClassic } from "@/components/studio-map/StudioMapClassic";
import { PageTransition } from "@/components/system/PageTransition";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
const MOCK_TEACHER_A = {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    created_at: "2026-01-01T00:00:00.000Z",
    name: "Alex Rivera",
    email: null,
    phone: null,
    status: "active",
    max_students: 20,
    weekly_capacity_minutes: null,
    notes: null,
    archived_at: null,
};
const MOCK_TEACHER_B = {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    tenant_id: "00000000-0000-0000-0000-000000000001",
    created_at: "2026-01-02T00:00:00.000Z",
    name: "Jordan Lee",
    email: null,
    phone: null,
    status: "active",
    max_students: 16,
    weekly_capacity_minutes: null,
    notes: null,
    archived_at: null,
};
const MOCK_STUDENTS = [
    { id: "cccccccc-cccc-cccc-cccc-cccccccccccc", name: "Sam Chen", status: "active" },
    { id: "dddddddd-dddd-dddd-dddd-dddddddddddd", name: "Riley Park", status: "active" },
    { id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", name: "Casey Nova", status: "paused" },
];
function OrbPhysicsDemo() {
    const [expandedTeacherId, setExpandedTeacherId] = React.useState(MOCK_TEACHER_A.id);
    return (_jsxs(Card, { padding: "lg", radius: "lg", variant: "default", className: "max-w-4xl", children: [_jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.16em] text-[var(--z-muted)]", children: "Orb physics" }), _jsx("p", { className: "mt-2 text-xs text-[var(--z-muted)]", children: "Staggered map entry, teacher magnet hover, student float / ripple / glow (see studio map tokens)." }), _jsx("div", { className: "mt-[var(--z-space-6)]", children: _jsx(StudioMapClassic, { studioLabel: "Demo", teachers: [
                        { teacher: MOCK_TEACHER_A, studentCount: 2 },
                        { teacher: MOCK_TEACHER_B, studentCount: 0 },
                    ], expandedTeacherId: expandedTeacherId, onTeacherToggle: (id) => setExpandedTeacherId((cur) => (cur === id ? null : id)), studentsForExpandedTeacher: expandedTeacherId === MOCK_TEACHER_A.id ? MOCK_STUDENTS : null, expandedStudentsLoading: false }) })] }));
}
function PageTransitionDemo() {
    const [k, setK] = React.useState(0);
    return (_jsxs(Card, { padding: "lg", radius: "lg", variant: "default", className: "max-w-4xl", children: [_jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.16em] text-[var(--z-muted)]", children: "Page transitions" }), _jsxs("p", { className: "mt-2 text-xs text-[var(--z-muted)]", children: ["Fade + slide using ", _jsx("code", { className: "text-[var(--z-accent-color)]", children: "z-page-transition" }), " (", _jsx("code", { className: "text-[var(--z-accent-color)]", children: "--z-duration-medium" }), ",", " ", _jsx("code", { className: "text-[var(--z-accent-color)]", children: "--z-ease-smooth" }), ")."] }), _jsx(Button, { type: "button", className: "mt-[var(--z-space-4)]", onClick: () => setK((n) => n + 1), children: "Replay transition" }), _jsx("div", { className: "mt-[var(--z-space-5)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-[var(--z-space-4)]", children: _jsx(PageTransition, { children: _jsx("p", { className: "text-sm text-[var(--z-fg)]", children: "Content block remounts with entry motion." }) }, k) })] }));
}
function NeonEffectsDemo() {
    return (_jsxs(Card, { padding: "lg", radius: "lg", variant: "default", className: "max-w-4xl", children: [_jsx("h2", { className: "text-sm font-extrabold uppercase tracking-[0.16em] text-[var(--z-muted)]", children: "Neon ramp" }), _jsxs("p", { className: "mt-2 text-xs text-[var(--z-muted)]", children: ["Hover panels use ", _jsx("code", { className: "text-[var(--z-accent-color)]", children: ".neon-ramp" }), " with", " ", _jsx("code", { className: "text-[var(--z-accent-color)]", children: "--z-accent-color" }), "."] }), _jsxs("div", { className: "mt-[var(--z-space-5)] flex flex-wrap gap-[var(--z-space-4)]", children: [_jsx("div", { className: "neon-ramp rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-[var(--z-space-5)] py-[var(--z-space-4)] text-sm text-[var(--z-fg)]", children: "Hover card" }), _jsx("button", { type: "button", className: "neon-ramp rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm font-semibold text-[var(--z-fg)]", children: "Hover control" })] })] }));
}
export default function SandboxAnimationsPage() {
    return (_jsx("div", { className: "min-h-full bg-[var(--z-bg)] p-[var(--z-space-8)] text-[var(--z-fg)]", children: _jsxs("div", { className: "mx-auto max-w-5xl space-y-[var(--z-space-10)]", children: [_jsxs("header", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.2em] text-[var(--z-muted)]", children: "Sandbox" }), _jsx("h1", { className: "mt-2 text-2xl font-semibold tracking-tight", children: "Animations & motion" })] }), _jsx(OrbPhysicsDemo, {}), _jsx(PageTransitionDemo, {}), _jsx(NeonEffectsDemo, {})] }) }));
}

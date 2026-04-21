"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { List } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils/cn";
export function StudentScheduleCard({ schedule, className }) {
    const items = schedule.map((s) => ({
        id: s.id,
        title: s.label,
        description: new Date(s.at).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }),
        action: (_jsx(Badge, { variant: s.lane === "upcoming" ? "success" : "neutral", active: s.lane === "upcoming", children: s.lane === "upcoming" ? "Upcoming" : "Logged" })),
    }));
    return (_jsx(Card, { variant: "elevated", padding: "lg", radius: "lg", shadow: "sm", className: cn(className), children: _jsx(Section, { title: "Schedule", description: "Touchpoints derived from lifecycle data.", spacing: "tight", children: items.length === 0 ? (_jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "No schedule rows yet." })) : (_jsx(List, { items: items })) }) }));
}

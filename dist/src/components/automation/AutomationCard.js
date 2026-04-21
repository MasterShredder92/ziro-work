"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/components/ui/utils";
export function AutomationCard({ title, description, enabled, onEnabledChange }) {
    return (_jsx(Card, { padding: "md", radius: "md", variant: "elevated", className: cn("border-[var(--z-border)] transition-[border-color,box-shadow] duration-200", enabled &&
            "border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_88%)]"), children: _jsx(Switch, { checked: enabled, onCheckedChange: onEnabledChange, label: title, description: description }) }));
}

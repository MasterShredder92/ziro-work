"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { cn } from "@/components/ui/utils/cn";
export function SettingsSection({ title, description, children, className }) {
    return (_jsxs("div", { className: cn("space-y-[var(--z-space-5)]", className), children: [_jsx(PageHeader, { title: title, subtitle: description }), _jsx(Section, { spacing: "tight", children: children })] }));
}

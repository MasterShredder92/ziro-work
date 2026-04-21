"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils";
export function StageHeader({ stageName, description, agentName, className }) {
    return (_jsx("div", { className: cn("min-w-0", className), children: _jsx(PageHeader, { title: stageName, subtitle: description, actions: _jsx(Badge, { variant: "success", active: true, children: agentName }) }) }));
}

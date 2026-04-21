"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { List } from "@/components/ui/List";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { fuzzyScore } from "@/lib/search/fuzzy";
import { cn, focusRingClassName } from "@/components/ui/utils";
const COMMANDS = [
    {
        id: "nav-dashboard",
        label: "Go to Dashboard",
        kind: "nav",
        href: "/dashboard",
        haystack: "dashboard home overview",
    },
    {
        id: "nav-studio-map",
        label: "Go to Studio Map",
        kind: "nav",
        href: "/studio-map",
        haystack: "studio map locations rooms",
    },
    {
        id: "act-family",
        label: "New Family",
        kind: "action",
        actionId: "newFamily",
        haystack: "new family account household",
    },
    {
        id: "act-student",
        label: "New Student",
        kind: "action",
        actionId: "newStudent",
        haystack: "new student learner enroll",
    },
    {
        id: "act-invoice",
        label: "New Invoice",
        kind: "action",
        actionId: "newInvoice",
        haystack: "new invoice billing charge",
    },
    {
        id: "nav-leads",
        label: "Review Leads",
        kind: "nav",
        href: "/lifecycle/lead-work",
        haystack: "leads pipeline intake prospects",
    },
    {
        id: "nav-at-risk",
        label: "See At-Risk Students",
        kind: "nav",
        href: "/lifecycle/retention",
        haystack: "at risk retention churn students",
    },
];
export function CommandPalette({ open, onClose, tenantId, onNewFamily, onNewStudent, onNewInvoice, }) {
    const router = useRouter();
    const [tab, setTab] = React.useState("search");
    const [commandQuery, setCommandQuery] = React.useState("");
    React.useEffect(() => {
        if (!open) {
            setTab("search");
            setCommandQuery("");
        }
    }, [open]);
    const filteredCommands = React.useMemo(() => {
        const q = commandQuery.trim();
        if (!q.length)
            return COMMANDS;
        return COMMANDS.filter((c) => Math.max(fuzzyScore(q, c.label), fuzzyScore(q, c.haystack)) > 0.25);
    }, [commandQuery]);
    const runCommand = React.useCallback((c) => {
        var _a;
        if (c.kind === "nav") {
            router.push(c.href);
            onClose();
            return;
        }
        const map = {
            newFamily: onNewFamily,
            newStudent: onNewStudent,
            newInvoice: onNewInvoice,
        };
        (_a = map[c.actionId]) === null || _a === void 0 ? void 0 : _a.call(map);
        onClose();
    }, [onClose, onNewFamily, onNewInvoice, onNewStudent, router]);
    const commandItems = React.useMemo(() => filteredCommands.map((c) => ({
        id: c.id,
        title: c.label,
        description: c.kind === "nav" ? c.href : "Workspace action",
        onPress: () => runCommand(c),
    })), [filteredCommands, runCommand]);
    return (_jsx(Modal, { open: open, onClose: onClose, title: "Command center", panelClassName: "max-w-2xl", children: _jsxs("div", { className: "space-y-[var(--z-space-4)]", children: [_jsx(Tabs, { tabs: [
                        { id: "search", label: "Search" },
                        { id: "commands", label: "Commands" },
                    ], activeTab: tab, onChange: setTab }), tab === "search" ? (_jsx(GlobalSearch, { tenantId: tenantId, onClose: onClose })) : (_jsxs("div", { children: [_jsx("input", { type: "search", value: commandQuery, onChange: (e) => setCommandQuery(e.target.value), placeholder: "Filter commands\u2026", className: cn("w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)]", "px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)]", "focus-visible:border-[color-mix(in_oklab,var(--z-accent),transparent_35%)]", "focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--z-accent),transparent_78%)]", focusRingClassName()) }), commandItems.length === 0 ? (_jsx("p", { className: "mt-[var(--z-space-4)] text-xs text-[var(--z-muted)]", children: "No commands match." })) : (_jsx("div", { className: "mt-[var(--z-space-4)] max-h-[min(48vh,360px)] overflow-y-auto pr-1", children: _jsx(List, { items: commandItems, itemClassName: "neon-ramp" }) }))] }))] }) }));
}

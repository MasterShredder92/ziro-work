"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { List } from "@/components/ui/List";
export function ReleaseEditor({ version, date, items, onChange }) {
    const updateItem = (index, value) => {
        const next = [...items];
        next[index] = value;
        onChange({ version, date, items: next });
    };
    const addItem = () => {
        onChange({ version, date, items: [...items, "New release note"] });
    };
    const removeItem = (index) => {
        onChange({ version, date, items: items.filter((_, i) => i !== index) });
    };
    const listItems = items.map((text, index) => ({
        id: `item-${index}`,
        titleLayout: "plain",
        title: (_jsx(Input, { className: "min-w-0", value: text, onChange: (e) => updateItem(index, e.target.value), "aria-label": `Release item ${index + 1}` })),
        action: (_jsx(Button, { type: "button", size: "sm", variant: "ghost", onClick: () => removeItem(index), children: "Remove" })),
    }));
    return (_jsxs(Card, { padding: "lg", radius: "md", variant: "elevated", className: "space-y-[var(--z-space-5)] border-[var(--z-border)]", children: [_jsxs("div", { className: "grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-2", children: [_jsx(Input, { label: "Version", value: version, onChange: (e) => onChange({ version: e.target.value, date, items }) }), _jsx(Input, { label: "Date", value: date, onChange: (e) => onChange({ version, date: e.target.value, items }), placeholder: "Apr 17, 2026" })] }), _jsxs("div", { className: "space-y-[var(--z-space-3)]", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsx("span", { className: "text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Highlights" }), _jsx(Button, { type: "button", size: "sm", variant: "secondary", onClick: addItem, children: "Add item" })] }), items.length ? _jsx(List, { items: listItems }) : _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "No bullets yet." })] })] }));
}

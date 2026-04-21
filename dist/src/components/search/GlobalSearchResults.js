"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useRouter } from "next/navigation";
import { List } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
const GROUP_META = [
    { id: "students", label: "Students" },
    { id: "families", label: "Families" },
    { id: "teachers", label: "Teachers" },
    { id: "invoices", label: "Invoices" },
    { id: "stages", label: "Stages" },
];
export function GlobalSearchResults({ results }) {
    const router = useRouter();
    const byGroup = React.useMemo(() => {
        const map = new Map();
        for (const g of GROUP_META)
            map.set(g.id, []);
        for (const r of results) {
            const bucket = map.get(r.group);
            if (bucket)
                bucket.push(r);
        }
        return map;
    }, [results]);
    return (_jsx("div", { className: "mt-[var(--z-space-4)] max-h-[min(52vh,400px)] space-y-[var(--z-space-6)] overflow-y-auto pr-1", children: GROUP_META.map(({ id, label }) => {
            var _a;
            const rows = (_a = byGroup.get(id)) !== null && _a !== void 0 ? _a : [];
            if (rows.length === 0)
                return null;
            const items = rows.map((r) => {
                var _a;
                return ({
                    id: r.id,
                    title: r.title,
                    description: r.description,
                    onPress: () => router.push(r.href),
                    action: (_jsx(Badge, { variant: (_a = r.badgeVariant) !== null && _a !== void 0 ? _a : "neutral", active: true, children: r.badge })),
                });
            });
            return (_jsxs("div", { children: [_jsx("div", { className: "mb-[var(--z-space-3)] text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: label }), _jsx(List, { items: items })] }, id));
        }) }));
}

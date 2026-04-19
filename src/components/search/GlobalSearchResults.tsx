"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { List, type ListItem } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
import type { BadgeProps } from "@/components/ui/Badge";

export type GlobalSearchGroup =
  | "students"
  | "families"
  | "teachers"
  | "invoices"
  | "stages";

export type GlobalSearchResultRow = {
  id: string;
  group: GlobalSearchGroup;
  title: string;
  description?: string;
  href: string;
  badge: string;
  badgeVariant?: BadgeProps["variant"];
};

export type GlobalSearchResultsProps = {
  results: GlobalSearchResultRow[];
};

const GROUP_META: { id: GlobalSearchGroup; label: string }[] = [
  { id: "students", label: "Students" },
  { id: "families", label: "Families" },
  { id: "teachers", label: "Teachers" },
  { id: "invoices", label: "Invoices" },
  { id: "stages", label: "Stages" },
];

export function GlobalSearchResults({ results }: GlobalSearchResultsProps) {
  const router = useRouter();

  const byGroup = React.useMemo(() => {
    const map = new Map<GlobalSearchGroup, GlobalSearchResultRow[]>();
    for (const g of GROUP_META) map.set(g.id, []);
    for (const r of results) {
      const bucket = map.get(r.group);
      if (bucket) bucket.push(r);
    }
    return map;
  }, [results]);

  return (
    <div className="mt-[var(--z-space-4)] max-h-[min(52vh,400px)] space-y-[var(--z-space-6)] overflow-y-auto pr-1">
      {GROUP_META.map(({ id, label }) => {
        const rows = byGroup.get(id) ?? [];
        if (rows.length === 0) return null;
        const items: ListItem[] = rows.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          onPress: () => router.push(r.href),
          action: (
            <Badge variant={r.badgeVariant ?? "neutral"} active>
              {r.badge}
            </Badge>
          ),
        }));
        return (
          <div key={id}>
            <div className="mb-[var(--z-space-3)] text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--z-muted)]">
              {label}
            </div>
            <List items={items} />
          </div>
        );
      })}
    </div>
  );
}

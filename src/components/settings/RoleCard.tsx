"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { List } from "@/components/ui/List";
import { cn } from "@/components/ui/utils/cn";

export type RoleCardPermission = { id: string; kind: "page" | "action"; label: string };

export type RoleCardProps = {
  role: string;
  permissions: RoleCardPermission[];
  className?: string;
};

export function RoleCard({ role, permissions, className }: RoleCardProps) {
  const pages = permissions.filter((p) => p.kind === "page");
  const actions = permissions.filter((p) => p.kind === "action");

  const pageItems = pages.map((p) => ({
    id: p.id,
    title: p.label,
    action: <Badge variant="success">View</Badge>,
  }));
  const actionItems = actions.map((p) => ({
    id: p.id,
    title: p.label,
    action: <Badge variant="neutral">Allow</Badge>,
  }));

  return (
    <Card variant="elevated" padding="lg" radius="lg" shadow="sm" className={cn(className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-lg font-semibold tracking-tight text-[var(--z-fg)]">{role}</div>
        <Badge variant="neutral" active>
          {permissions.length} grants
        </Badge>
      </div>
      <div className="mt-[var(--z-space-6)] grid grid-cols-1 gap-[var(--z-space-6)] lg:grid-cols-2">
        <div>
          <div className="mb-[var(--z-space-2)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
            Allowed pages
          </div>
          {pageItems.length ? <List items={pageItems} /> : <p className="text-sm text-[var(--z-muted)]">—</p>}
        </div>
        <div>
          <div className="mb-[var(--z-space-2)] text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
            Allowed actions
          </div>
          {actionItems.length ? <List items={actionItems} /> : <p className="text-sm text-[var(--z-muted)]">—</p>}
        </div>
      </div>
    </Card>
  );
}

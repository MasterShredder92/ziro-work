"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/utils/cn";

export type SettingsGroupProps = {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function SettingsGroup({ title, children, className }: SettingsGroupProps) {
  return (
    <Card variant="elevated" padding="md" radius="lg" shadow="sm" className={cn(className)}>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">{title}</div>
      <div className="mt-[var(--z-space-4)] space-y-[var(--z-space-4)]">{children}</div>
    </Card>
  );
}

"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";

export type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card
      variant="outline"
      padding="md"
      radius="md"
      className={cn("border-dashed text-center", className)}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-[var(--z-fg)]">{title}</p>
      {description ? (
        <p className="mt-[var(--z-space-2)] text-xs text-[var(--z-muted)]">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <div className="mt-[var(--z-space-4)]">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

export type InlineNoticeProps = {
  tone?: "default" | "danger" | "warning" | "success";
  title?: string;
  children: React.ReactNode;
  className?: string;
};

const toneClass: Record<NonNullable<InlineNoticeProps["tone"]>, string> = {
  default: "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-fg)]",
  danger:
    "border-[color-mix(in_oklab,var(--z-danger),transparent_60%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_90%)] text-[color-mix(in_oklab,var(--z-danger),white_8%)]",
  warning:
    "border-[color-mix(in_oklab,var(--z-warning),transparent_65%)] bg-[color-mix(in_oklab,var(--z-warning),transparent_92%)] text-[color-mix(in_oklab,var(--z-warning),white_8%)]",
  success:
    "border-[color-mix(in_oklab,var(--z-accent),transparent_65%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] text-[var(--z-accent)]",
};

export function InlineNotice({ tone = "default", title, children, className }: InlineNoticeProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--z-radius-sm)] border px-[var(--z-space-3)] py-[var(--z-space-2)] text-xs",
        toneClass[tone],
        className,
      )}
      role={tone === "danger" ? "alert" : "status"}
      aria-live={tone === "danger" ? "assertive" : "polite"}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <p className={title ? "mt-1" : ""}>{children}</p>
    </div>
  );
}

export type SurfaceSkeletonProps = {
  lines?: number;
  className?: string;
};

export function SurfaceSkeleton({ lines = 3, className }: SurfaceSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-4)]",
        className,
      )}
      aria-hidden
    >
      <div className="h-4 w-32 animate-pulse rounded bg-[var(--z-surface-2)]" />
      <div className="mt-[var(--z-space-3)] space-y-[var(--z-space-2)]">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className="h-3 animate-pulse rounded bg-[var(--z-surface-2)]"
            style={{ width: `${88 - idx * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}

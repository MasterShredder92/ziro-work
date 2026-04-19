"use client";

import * as React from "react";
import { cn } from "@/components/ui/utils";
import { Button } from "@/components/ui/Button";

export type AnnouncementBannerProps = {
  title: string;
  description: string;
  onClose: () => void;
  onDetails?: () => void;
  className?: string;
};

export function AnnouncementBanner({ title, description, onClose, onDetails, className }: AnnouncementBannerProps) {
  return (
    <div
      role="region"
      aria-label="Announcement"
      className={cn(
        "shrink-0 border-b border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] bg-[color-mix(in_oklab,var(--z-surface-2),var(--z-accent)_10%)] px-[var(--z-space-4)] py-[var(--z-space-3)] sm:px-[var(--z-space-5)]",
        "shadow-[inset_0_1px_0_color-mix(in_oklab,var(--z-accent),transparent_70%)]",
        className,
      )}
    >
      <div className="flex flex-col gap-[var(--z-space-3)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--z-accent)]">{title}</div>
          <p className="mt-1 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_8%)]">{description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onDetails ? (
            <Button type="button" variant="secondary" size="sm" onClick={onDetails}>
              Details
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

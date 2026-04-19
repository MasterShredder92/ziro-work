"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";

export type TourStepProps = {
  title: string;
  description: string;
  nextLabel: string;
  onNext: () => void;
  onSkip?: () => void;
  style?: React.CSSProperties;
  placement?: "top" | "bottom";
  className?: string;
};

export function TourStep({
  title,
  description,
  nextLabel,
  onNext,
  onSkip,
  style,
  placement = "bottom",
  className,
}: TourStepProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "pointer-events-auto fixed z-[80] w-[min(92vw,360px)] rounded-[var(--z-radius-lg)] border border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] bg-[var(--z-surface)] p-[var(--z-space-5)] shadow-[0_20px_60px_rgba(0,0,0,0.65)]",
        placement === "top" ? "origin-bottom" : "origin-top",
        className
      )}
      style={style}
    >
      <div className="text-sm font-extrabold text-[var(--z-fg)]">{title}</div>
      <p className="mt-2 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_35%)]">{description}</p>
      <div className="mt-[var(--z-space-4)] flex flex-wrap items-center justify-end gap-2">
        {onSkip ? (
          <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
            Skip
          </Button>
        ) : null}
        <Button type="button" variant="primary" size="sm" onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

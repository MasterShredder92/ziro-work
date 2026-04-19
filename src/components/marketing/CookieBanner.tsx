"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";

const STORAGE_KEY = "ziro.cookieConsent";

export type CookieBannerProps = {
  className?: string;
  /** When false, always starts visible (e.g. sandbox previews). */
  honorStoredConsent?: boolean;
  /** `fixed`: marketing dock; `inline`: in-flow QA preview */
  position?: "fixed" | "inline";
};

export function CookieBanner({
  className,
  honorStoredConsent = true,
  position = "fixed",
}: CookieBannerProps) {
  const [visible, setVisible] = React.useState(() => honorStoredConsent === false);

  React.useEffect(() => {
    if (!honorStoredConsent) return;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      setVisible(v !== "accepted" && v !== "declined");
    } catch {
      setVisible(true);
    }
  }, [honorStoredConsent]);

  const persist = React.useCallback((value: "accepted" | "declined") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={cn(
        position === "fixed"
          ? "pointer-events-none fixed inset-x-0 bottom-0 z-[55] px-[var(--z-space-3)] pb-[var(--z-space-3)] sm:px-[var(--z-space-5)]"
          : "relative z-[1] mx-auto mt-[var(--z-space-6)] w-full max-w-4xl px-0",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto flex max-w-4xl flex-col gap-[var(--z-space-3)] rounded-[var(--z-radius-lg)] border border-[color-mix(in_oklab,var(--z-accent),transparent_45%)]",
          "bg-[color-mix(in_oklab,var(--z-surface-2),var(--z-accent)_8%)] p-[var(--z-space-4)] shadow-[0_-8px_40px_rgba(0,0,0,0.55)] backdrop-blur-md sm:flex-row sm:items-center sm:justify-between",
        )}
        role="dialog"
        aria-label="Cookie preferences"
      >
        <p className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">
          We use first-party cookies for session + preferences. Analytics events are mocked in the console until you
          wire a provider.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="primary" size="sm" onClick={() => persist("accepted")}>
            Accept
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => persist("declined")}>
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

type UnreadResponse = {
  data?: {
    totalUnread?: number;
  };
};

interface MessagesBadgeProps {
  className?: string;
  pollMs?: number;
}

/**
 * Tiny client component that polls `/api/messages/unread` and renders a badge
 * with the total unread count for the current user. Safe to mount anywhere in
 * the global nav.
 */
export function MessagesBadge({
  className,
  pollMs = 60_000,
}: MessagesBadgeProps) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/messages/unread", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const payload = (await res.json()) as UnreadResponse;
        if (cancelled) return;
        const next = payload.data?.totalUnread ?? 0;
        setCount(next);
      } catch {
        /* noop */
      }
    };

    void fetchCount();
    const interval = window.setInterval(fetchCount, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [pollMs]);

  if (count <= 0) return null;

  return (
    <span
      className={
        className ??
        "ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--z-accent)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--z-on-accent,white)]"
      }
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

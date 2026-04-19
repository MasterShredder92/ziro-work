"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useNotifications } from "@/components/notifications/notificationsContext";

export function NotificationBell() {
  const { unreadCount, openPanel } = useNotifications();

  return (
    <button
      type="button"
      onClick={openPanel}
      aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
      className={cn(
        "neon-ramp relative inline-flex h-10 w-10 items-center justify-center rounded-[var(--z-radius-md)]",
        "border border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-fg)]",
        "hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_55%)] hover:text-[var(--z-accent-color)]",
        "transition-colors duration-[var(--z-duration-fast)] [transition-timing-function:var(--z-ease-smooth)]",
        focusRingClassName(),
      )}
    >
      {unreadCount > 0 ? (
        <span className="z-notify-pulse pointer-events-none absolute inset-0 rounded-[var(--z-radius-md)] ring-1 ring-[color-mix(in_oklab,var(--z-accent-color),transparent_40%)]" />
      ) : null}
      <Bell className="relative z-[1] h-[18px] w-[18px]" strokeWidth={2} />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 z-[2] min-w-[18px] rounded-full bg-[var(--z-accent-color)] px-1 text-center text-[10px] font-extrabold leading-[18px] text-black shadow-[0_0_12px_color-mix(in_oklab,var(--z-accent-color),transparent_35%)]">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}

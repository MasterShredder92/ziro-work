"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";
import { cn } from "@/components/ui/utils";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  eventName: string;
  payload?: Record<string, unknown>;
};

export function MarketingTrackedLink({ eventName, payload, onClick, className, ...props }: TrackedLinkProps) {
  const { trackEvent } = useAnalytics();
  return (
    <Link
      prefetch
      {...props}
      className={cn(className)}
      onClick={(e) => {
        trackEvent(eventName, { href: String(props.href), ...payload });
        onClick?.(e);
      }}
    />
  );
}

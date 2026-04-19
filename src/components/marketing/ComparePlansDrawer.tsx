"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";

const PLANS = [
  {
    id: "launch",
    name: "Launch",
    price: "$49",
    cadence: "/mo",
    blurb: "Solo director + one location.",
    features: ["Lifecycle engine", "Studio map", "Dashboard + feed", "Email support"],
  },
  {
    id: "scale",
    name: "Scale",
    price: "$129",
    cadence: "/mo",
    blurb: "Growing faculty + automations.",
    features: ["Everything in Launch", "Automations", "Command palette", "Priority support"],
  },
  {
    id: "command",
    name: "Command",
    price: "Custom",
    cadence: "",
    blurb: "Multi-site + API + white-glove.",
    features: ["Everything in Scale", "Dedicated success", "Custom integrations", "SLA"],
  },
] as const;

export type ComparePlansDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function ComparePlansDrawer({ open, onClose }: ComparePlansDrawerProps) {
  const router = useRouter();
  const { trackEvent } = useAnalytics();

  return (
    <Drawer open={open} onClose={onClose} title="Compare plans">
      <div className="space-y-[var(--z-space-6)]">
        <p className="text-sm text-[var(--z-muted)]">
          Pick the tier that matches your roster density. Calculator lives on the pricing page.
        </p>
        <div className="space-y-[var(--z-space-5)]">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-[var(--z-space-4)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-[var(--z-fg)]">{p.name}</span>
                    {p.id === "scale" ? (
                      <Badge variant="success" active>
                        Popular
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-[var(--z-muted)]">{p.blurb}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-[var(--z-accent)]">
                    {p.price}
                    <span className="text-xs font-semibold text-[var(--z-muted)]">{p.cadence}</span>
                  </div>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs text-[color-mix(in_oklab,var(--z-fg),transparent_30%)]">
                {p.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="flex-1 sm:flex-none"
                  onClick={() => {
                    trackEvent("compare_drawer_start_trial", { plan: p.id });
                    onClose();
                    router.push("/signup");
                  }}
                >
                  Start trial
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    trackEvent("compare_drawer_pricing", { plan: p.id });
                    onClose();
                    router.push("/pricing");
                  }}
                >
                  Pricing
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="w-full"
          onClick={() => {
            trackEvent("compare_drawer_demo", {});
            onClose();
            router.push("/demo");
          }}
        >
          Try interactive demo
        </Button>
      </div>
    </Drawer>
  );
}

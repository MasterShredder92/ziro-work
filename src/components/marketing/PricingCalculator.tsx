"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Slider } from "@/components/ui/Slider";
import { useAnalytics } from "@/components/analytics/AnalyticsProvider";

export function PricingCalculator() {
  const { trackEvent } = useAnalytics();
  const [seats, setSeats] = React.useState(12);

  React.useEffect(() => {
    trackEvent("pricing_calculator_view", { seats: 12 });
  }, [trackEvent]);

  return (
    <Card variant="elevated" padding="md" radius="lg" shadow="sm" className="space-y-[var(--z-space-4)]">
      <div className="text-sm font-extrabold text-[var(--z-fg)]">Seat calculator</div>
      <p className="text-xs text-[var(--z-muted)]">Drag to model roster load—numbers are illustrative.</p>
      <Slider
        label="Seats"
        min={1}
        max={80}
        step={1}
        value={seats}
        onValueChange={(v) => {
          setSeats(Math.round(v));
          trackEvent("pricing_calculator_change", { seats: Math.round(v) });
        }}
      />
      <div className="text-xs font-semibold text-[var(--z-accent)]">
        Modeled monthly: ${(49 + Math.max(0, seats - 5) * 4).toLocaleString()} (mock)
      </div>
    </Card>
  );
}

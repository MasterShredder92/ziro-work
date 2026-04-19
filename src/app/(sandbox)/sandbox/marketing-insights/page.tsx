import Link from "next/link";
import { BarChart3, Sparkles, Timer } from "lucide-react";
import { InsightStat } from "@/components/marketing/InsightStat";

export default function SandboxMarketingInsightsPage() {
  return (
    <div className="space-y-[var(--z-space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-[var(--z-fg)]">InsightStat</h1>
        <Link className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)]" href="/sandbox">
          Back
        </Link>
      </div>
      <p className="text-sm text-[var(--z-muted)]">
        Variants: with and without delta, long labels. Hover uses{" "}
        <code className="text-[var(--z-accent)]">motion-safe:hover:scale-[1.02]</code> with{" "}
        <code className="text-[var(--z-accent)]">motion-reduce:hover:scale-100</code>.
      </p>

      <div className="grid max-w-4xl grid-cols-1 gap-[var(--z-space-4)] md:grid-cols-2">
        <InsightStat
          label="With delta (positive)"
          value="12,480"
          delta="+8.2% vs last week"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <InsightStat
          label="With delta (negative)"
          value="41.2%"
          delta="-2.4% vs last week"
          icon={<Timer className="h-5 w-5" />}
        />
        <InsightStat label="No delta" value="186" icon={<Sparkles className="h-5 w-5" />} />
        <InsightStat
          label="Very long label — organic search impressions trailing thirty-day window"
          value="2.1M"
          delta="+1.1%"
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}

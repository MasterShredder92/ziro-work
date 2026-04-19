import { PricingCalculator } from "@/components/pricing/PricingCalculator";

export default function SandboxPricingCalculatorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-extrabold text-[var(--z-fg)]">PricingCalculator</h1>
      <p className="text-sm text-[var(--z-muted)]">Sliders + recommended plan highlight.</p>
      <PricingCalculator />
    </div>
  );
}

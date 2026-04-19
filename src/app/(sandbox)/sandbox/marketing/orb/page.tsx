import { HeroOrb } from "@/components/marketing/HeroOrb";

export default function SandboxMarketingOrbPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-extrabold text-[var(--z-fg)]">HeroOrb</h1>
      <p className="text-sm text-[var(--z-muted)]">CSS-only float + glow ramp (see animations.css).</p>
      <div className="flex justify-center py-12">
        <HeroOrb />
      </div>
    </div>
  );
}

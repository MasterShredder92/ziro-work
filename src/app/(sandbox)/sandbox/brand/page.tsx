import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { LogoShowcase } from "@/components/brand/LogoShowcase";
import { ColorSwatch } from "@/components/brand/ColorSwatch";
import { SocialPreviewCard } from "@/components/brand/SocialPreviewCard";

export default function SandboxBrandPage() {
  return (
    <div className="space-y-[var(--z-space-10)]">
      <PageHeader title="Sandbox · Brand" subtitle="LogoShowcase, ColorSwatch, and SocialPreviewCard QA." />

      <Section title="LogoShowcase" accent>
        <div className="grid gap-4 sm:grid-cols-3">
          <LogoShowcase variant="light" />
          <LogoShowcase variant="dark" />
          <LogoShowcase variant="mono" />
        </div>
      </Section>

      <Section title="ColorSwatch" accent>
        <div className="grid max-w-lg gap-4 sm:grid-cols-2">
          <ColorSwatch name="Accent" value="var(--z-accent)" />
          <ColorSwatch name="Surface" value="var(--z-surface)" />
        </div>
      </Section>

      <Section title="SocialPreviewCard" accent>
        <SocialPreviewCard title="Sandbox preview" subtitle="Scaled inside the sandbox shell for responsive checks." />
      </Section>
    </div>
  );
}

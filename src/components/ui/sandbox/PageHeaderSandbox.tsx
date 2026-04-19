import * as React from "react";
import { PageHeader } from "../PageHeader";
import { Card } from "../Card";
import { Body, Caption } from "../../premium/Typography";

function FauxButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-md border border-[var(--z-border)] px-3 py-1.5 text-sm font-medium tracking-[-0.01em] text-[var(--z-fg)] hover:bg-[color-mix(in_oklab,var(--z-fg),transparent_92%)]"
    >
      {children}
    </button>
  );
}

export function PageHeaderSandbox() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Premium primitives"
        subtitle="Minimal charcoal foundation with neon accents."
        actions={
          <>
            <FauxButton>Secondary</FauxButton>
            <FauxButton>
              <span className="text-[var(--z-accent)]">Primary</span>
            </FauxButton>
          </>
        }
      />

      <Card>
        <Body className="font-medium">Content below</Body>
        <Caption className="mt-2">
          The header stays purely visual: title/subtitle/actions. No business logic.
        </Caption>
      </Card>
    </div>
  );
}


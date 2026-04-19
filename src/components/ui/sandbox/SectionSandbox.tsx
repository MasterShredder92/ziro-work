import * as React from "react";
import { Section } from "../Section";
import { Card } from "../Card";
import { Body, Caption, H3 } from "../../premium/Typography";

export function SectionSandbox() {
  return (
    <div className="flex flex-col gap-10">
      <Section
        title="Section (accent)"
        description="Vertical stack wrapper to group blocks. Optional title + description. Spacing tokens."
        accent
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <Body className="font-medium">Group A</Body>
            <Caption className="mt-2">A logical cluster of UI elements.</Caption>
          </Card>
          <Card variant="outline">
            <Body className="font-medium">Group B</Body>
            <Caption className="mt-2">Outline variant inside a section.</Caption>
          </Card>
        </div>
      </Section>

      <Section title="Section (tight)" description="A denser stack for compact pages." spacing="tight">
        <Card padding="sm">
          <H3 className="text-base">Compact block</H3>
          <Caption className="mt-2">Use when screen real estate is tight.</Caption>
        </Card>
      </Section>
    </div>
  );
}


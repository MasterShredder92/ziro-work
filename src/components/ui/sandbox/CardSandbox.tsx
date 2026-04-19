import * as React from "react";
import { Card } from "../Card";
import { H3, Caption, Body } from "../../premium/Typography";

export function CardSandbox() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <H3>Card</H3>
        <Caption className="mt-1">Default / Elevated / Outline. Padding + radius + shadow tokens.</Caption>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <Body className="font-medium">Default</Body>
          <Caption className="mt-2">Surface + border. Neutral, composable.</Caption>
        </Card>

        <Card variant="elevated" shadow="sm">
          <Body className="font-medium">Elevated</Body>
          <Caption className="mt-2">Slightly lifted. Premium depth.</Caption>
        </Card>

        <Card variant="outline" padding="lg" radius="lg">
          <Body className="font-medium">Outline</Body>
          <Caption className="mt-2">Transparent body. Strong boundary.</Caption>
        </Card>
      </div>
    </div>
  );
}


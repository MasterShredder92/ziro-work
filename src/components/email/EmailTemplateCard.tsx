"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils";
import type { EmailTemplateCategory } from "@/components/email/emailTypes";

export type EmailTemplateCardProps = {
  title: string;
  description: string;
  category: EmailTemplateCategory;
  selected?: boolean;
  /** When omitted, the card is display-only (no hover affordance). */
  onSelect?: () => void;
};

const CATEGORY_VARIANT: Record<
  EmailTemplateCategory,
  "neutral" | "success" | "warning" | "danger"
> = {
  Onboarding: "success",
  Lifecycle: "neutral",
  Billing: "warning",
  "Win-back": "danger",
  Marketing: "neutral",
};

export function EmailTemplateCard({
  title,
  description,
  category,
  selected,
  onSelect,
}: EmailTemplateCardProps) {
  const body = (
    <Card
      padding="md"
      radius="md"
      variant="default"
      className={cn(
        "h-full transition-[border-color,box-shadow] duration-200",
        onSelect &&
          "hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_82%)]",
        selected &&
          "border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_78%),0_0_22px_color-mix(in_oklab,var(--z-accent),transparent_92%)]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold tracking-tight text-[var(--z-fg)]">{title}</h3>
        <Badge variant={CATEGORY_VARIANT[category]} active>
          {category}
        </Badge>
      </div>
      <p className="mt-[var(--z-space-3)] text-xs leading-relaxed text-[var(--z-muted)]">{description}</p>
    </Card>
  );

  if (!onSelect) {
    return <div className="w-full">{body}</div>;
  }

  return (
    <button type="button" onClick={onSelect} className="w-full text-left">
      {body}
    </button>
  );
}

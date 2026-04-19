"use client";

import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { List } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/components/ui/utils/cn";

export type StudentScheduleEntry = {
  id: string;
  at: string;
  label: string;
  lane?: "upcoming" | "recent";
};

export type StudentScheduleCardProps = {
  schedule: StudentScheduleEntry[];
  className?: string;
};

export function StudentScheduleCard({ schedule, className }: StudentScheduleCardProps) {
  const items = schedule.map((s) => ({
    id: s.id,
    title: s.label,
    description: new Date(s.at).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    action: (
      <Badge variant={s.lane === "upcoming" ? "success" : "neutral"} active={s.lane === "upcoming"}>
        {s.lane === "upcoming" ? "Upcoming" : "Logged"}
      </Badge>
    ),
  }));

  return (
    <Card variant="elevated" padding="lg" radius="lg" shadow="sm" className={cn(className)}>
      <Section title="Schedule" description="Touchpoints derived from lifecycle data." spacing="tight">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--z-muted)]">No schedule rows yet.</p>
        ) : (
          <List items={items} />
        )}
      </Section>
    </Card>
  );
}

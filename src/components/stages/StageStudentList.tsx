"use client";

import { useRouter } from "next/navigation";
import { List, type ListItem } from "@/components/ui/List";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/utils";

function OpenStudentButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <Button type="button" variant="secondary" size="sm" onClick={() => router.push(`/students/${id}`)}>
      Open student
    </Button>
  );
}

function digitsOnly(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export type StageStudentListRow = {
  id: string;
  name: string;
  // Contact info comes from the linked family, not the student record
  family_email: string | null;
  family_phone: string | null;
  blockers: string[];
  nextStep: string;
  riskBand: "low" | "medium" | "high";
};

export type StageStudentListProps = {
  students: StageStudentListRow[];
  className?: string;
};

function riskVariant(band: StageStudentListRow["riskBand"]): "success" | "warning" | "danger" | "neutral" {
  if (band === "high") return "danger";
  if (band === "medium") return "warning";
  return "success";
}

export function StageStudentList({ students, className }: StageStudentListProps) {
  const items: ListItem[] = students.map((s) => {
    const phone = (s.family_phone ?? "").trim();
    const email = (s.family_email ?? "").trim();
    const tel = phone ? digitsOnly(phone) : "";
    const canCall = tel.length > 0;
    const canText = tel.length > 0;
    const canEmail = email.length > 0;

    return {
      id: s.id,
      title: s.name,
      description: (
        <div className="space-y-2">
        {s.blockers.length > 0 ? (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Needs attention</div>
            <ul className="mt-1 space-y-1">
              {s.blockers.map((b, i) => (
                <li key={`${s.id}-b-${i}`} className="text-xs text-[color-mix(in_oklab,var(--z-fg),transparent_18%)]">
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">Do this next</div>
          <div className="mt-1 text-xs text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">{s.nextStep}</div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {canCall ? (
            <a
              className="rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[11px] font-semibold text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] hover:text-[var(--z-accent)]"
              href={`tel:${tel}`}
            >
              Call
            </a>
          ) : null}
          {canText ? (
            <a
              className="rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[11px] font-semibold text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] hover:text-[var(--z-accent)]"
              href={`sms:${tel}`}
            >
              Text
            </a>
          ) : null}
          {canEmail ? (
            <a
              className="rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[11px] font-semibold text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] hover:text-[var(--z-accent)]"
              href={`mailto:${email}`}
            >
              Email
            </a>
          ) : null}
        </div>
        </div>
      ),
      action: (
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
        <Badge variant={riskVariant(s.riskBand)} active={s.riskBand !== "low"}>
          {s.riskBand === "low" ? "On track" : s.riskBand === "medium" ? "Watch closely" : "Needs help now"}
        </Badge>
        <OpenStudentButton id={s.id} />
        </div>
      ),
    };
  });

  return (
    <section className={cn("min-w-0", className)}>
      <List items={items} />
    </section>
  );
}

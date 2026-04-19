import type { MergeField } from "@/lib/templates/types";

export interface MergeFieldReferenceProps {
  mergeFields: MergeField[];
  missing?: string[];
}

const GROUP_LABELS: Record<string, string> = {
  student: "Student",
  family: "Family",
  teacher: "Teacher",
  lesson: "Lesson",
  tenant: "Tenant",
  custom: "Custom",
};

export function MergeFieldReference({
  mergeFields,
  missing,
}: MergeFieldReferenceProps) {
  const groups = mergeFields.reduce<Record<string, MergeField[]>>((acc, f) => {
    const key = f.group ?? "custom";
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

  const groupKeys = Object.keys(groups).sort();

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        Available merge fields
      </div>
      {missing && missing.length > 0 ? (
        <div className="rounded-md border border-[color-mix(in_oklab,var(--z-danger),transparent_50%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] p-3 text-sm text-[var(--z-danger)]">
          <div className="font-semibold">Unresolved fields in last render:</div>
          <ul className="mt-1 list-disc pl-5 text-xs">
            {missing.map((m) => (
              <li key={m}>
                <code>{`{{${m}}}`}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {groupKeys.map((key) => (
          <div
            key={key}
            className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-3"
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              {GROUP_LABELS[key] ?? key}
            </div>
            <ul className="space-y-2 text-sm">
              {groups[key].map((f) => (
                <li key={f.path}>
                  <code className="rounded bg-[color-mix(in_oklab,var(--z-surface),black_4%)] px-1.5 py-0.5 text-xs text-[var(--z-accent)]">
                    {`{{${f.path}}}`}
                  </code>
                  <div className="mt-1 text-xs text-[var(--z-fg)]/80">
                    {f.label}
                  </div>
                  <div className="text-xs text-[var(--z-muted)]">
                    {f.description}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

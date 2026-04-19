import type {
  Form,
  FormField,
  FormSubmission,
  FormSubmissionAnswer,
} from "@/lib/forms/types";

export type SubmissionDetailProps = {
  form: Form | null;
  fields: FormField[];
  submission: FormSubmission;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.map((v) => String(v)).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function SubmissionDetail({
  form,
  fields,
  submission,
}: SubmissionDetailProps) {
  const fieldMap = new Map(fields.map((f) => [f.id, f]));
  const fieldByKey = new Map(fields.map((f) => [f.fieldKey, f]));
  const answers: FormSubmissionAnswer[] = submission.answers ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <div className="text-sm text-[var(--z-muted)]">Form</div>
        <div className="text-base font-semibold text-[var(--z-fg)]">
          {form?.name ?? "Unknown form"}
        </div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <MetaCell label="Status" value={submission.status} />
          <MetaCell
            label="Started"
            value={
              submission.startedAt
                ? new Date(submission.startedAt).toLocaleString()
                : "–"
            }
          />
          <MetaCell
            label="Completed"
            value={
              submission.completedAt
                ? new Date(submission.completedAt).toLocaleString()
                : "–"
            }
          />
          <MetaCell
            label="Profile"
            value={submission.profileId ?? "anonymous"}
          />
        </div>
      </div>

      <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[color-mix(in_oklab,var(--z-surface-2),transparent_20%)] text-left">
              <th className="px-4 py-2 font-medium text-[var(--z-muted)]">Field</th>
              <th className="px-4 py-2 font-medium text-[var(--z-muted)]">Value</th>
            </tr>
          </thead>
          <tbody>
            {answers.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-6 text-center text-[var(--z-muted)]"
                >
                  No answers recorded.
                </td>
              </tr>
            ) : (
              answers.map((a, idx) => {
                const field =
                  (a.fieldId && fieldMap.get(a.fieldId)) ||
                  (a.fieldKey && fieldByKey.get(a.fieldKey)) ||
                  null;
                return (
                  <tr
                    key={`${a.fieldKey ?? a.fieldId ?? idx}`}
                    className="border-t border-[var(--z-border)]"
                  >
                    <td className="px-4 py-2 align-top">
                      <div className="text-[var(--z-fg)]">
                        {field?.label ?? a.label ?? a.fieldKey ?? "Field"}
                      </div>
                      <div className="text-[11px] text-[var(--z-muted)] font-mono">
                        {a.fieldKey ?? field?.fieldKey ?? ""}
                      </div>
                    </td>
                    <td className="px-4 py-2 align-top text-[var(--z-fg)] whitespace-pre-wrap">
                      {formatValue(a.value)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
        {label}
      </div>
      <div className="mt-0.5 text-[var(--z-fg)]">{value}</div>
    </div>
  );
}

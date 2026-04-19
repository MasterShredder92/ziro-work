"use client";

import type { ReportParameter } from "@/lib/reports/types";
import { useMemo } from "react";

export type ReportParameterFormProps = {
  parameters: ReportParameter[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onSubmit: () => void;
  submitting?: boolean;
};

export function ReportParameterForm({
  parameters,
  values,
  onChange,
  onSubmit,
  submitting = false,
}: ReportParameterFormProps) {
  const withDefaults = useMemo(() => {
    return parameters.map((p) => ({
      ...p,
      value:
        values[p.key] !== undefined && values[p.key] !== null
          ? values[p.key]
          : p.defaultValue,
    }));
  }, [parameters, values]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {withDefaults.map((p) => (
          <label key={p.key} className="flex flex-col gap-1 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
              {p.label}
              {p.required ? (
                <span className="text-[#ff6666] ml-1">*</span>
              ) : null}
            </span>
            <ParameterInput
              parameter={p}
              value={p.value}
              onChange={(v) => onChange(p.key, v)}
            />
            {p.description ? (
              <span className="text-[11px] text-[var(--z-muted)]">
                {p.description}
              </span>
            ) : null}
          </label>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--z-border)]">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-md bg-[#00ff88] text-black font-semibold px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00ff88]/90 transition-colors"
        >
          {submitting ? "Running…" : "Run report"}
        </button>
      </div>
    </form>
  );
}

function ParameterInput({
  parameter,
  value,
  onChange,
}: {
  parameter: ReportParameter;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const baseClass =
    "rounded-md bg-[color-mix(in_oklab,var(--z-surface),black_20%)] border border-[var(--z-border)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:border-[#00ff88]/60";

  switch (parameter.type) {
    case "boolean":
      return (
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-[#00ff88]"
        />
      );
    case "number":
      return (
        <input
          type="number"
          value={typeof value === "number" ? value : ""}
          placeholder={parameter.placeholder}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) ? n : null);
          }}
          className={baseClass}
        />
      );
    case "date":
      return (
        <input
          type="date"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      );
    case "select":
      return (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        >
          <option value="">—</option>
          {(parameter.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case "dateRange": {
      const v = (value ?? {}) as { from?: string; to?: string };
      return (
        <div className="flex gap-2">
          <input
            type="date"
            value={v.from ?? ""}
            onChange={(e) => onChange({ ...v, from: e.target.value })}
            className={baseClass + " flex-1"}
          />
          <input
            type="date"
            value={v.to ?? ""}
            onChange={(e) => onChange({ ...v, to: e.target.value })}
            className={baseClass + " flex-1"}
          />
        </div>
      );
    }
    case "string":
    default:
      return (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          placeholder={parameter.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      );
  }
}

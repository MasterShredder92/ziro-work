"use client";

import { useCallback, useState } from "react";
import type {
  ReportDefinitionSummary,
  ReportResult,
} from "@/lib/reports/types";
import { ReportParameterForm } from "./ReportParameterForm";
import { ReportResultTable } from "./ReportResultTable";
import { ReportResultChart } from "./ReportResultChart";

export type ReportRunnerProps = {
  definition: ReportDefinitionSummary;
  tenantId: string;
  initialParams?: Record<string, unknown>;
};

function formatSummaryValue(
  value: number | string,
  format: "number" | "currency" | "percent" | "text" | undefined,
): string {
  if (format === "currency" && typeof value === "number") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value / 100);
  }
  if (format === "percent" && typeof value === "number") {
    return `${Math.round(value)}%`;
  }
  if (format === "number" && typeof value === "number") {
    return new Intl.NumberFormat("en-US").format(value);
  }
  return String(value);
}

export function ReportRunner({
  definition,
  tenantId,
  initialParams = {},
}: ReportRunnerProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = { ...initialParams };
    for (const p of definition.parameters) {
      if (defaults[p.key] === undefined && p.defaultValue !== undefined) {
        defaults[p.key] = p.defaultValue;
      }
    }
    return defaults;
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/reports/api/run", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          reportId: definition.id,
          params: values,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { data?: ReportResult; error?: string }
        | null;
      if (!res.ok || !json || !json.data) {
        const message = json?.error ?? `Request failed (${res.status})`;
        setError(message);
        setResult(null);
      } else {
        setResult(json.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setResult(null);
    } finally {
      setSubmitting(false);
    }
  }, [definition.id, tenantId, values]);

  return (
    <div className="space-y-4">
      <ReportParameterForm
        parameters={definition.parameters}
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {error ? (
        <div className="rounded-[var(--z-radius-lg)] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {result ? (
        <>
          {result.summary.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {result.summary.map((m) => (
                <div
                  key={m.key}
                  className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
                    {m.label}
                  </div>
                  <div className="mt-1 text-xl font-semibold text-[var(--z-fg)]">
                    {formatSummaryValue(m.value, m.format)}
                  </div>
                  {m.sublabel ? (
                    <div className="mt-1 text-[11px] text-[var(--z-muted)]">
                      {m.sublabel}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {result.chart ? (
            <ReportResultChart chart={result.chart} />
          ) : null}

          <ReportResultTable result={result} />
        </>
      ) : null}
    </div>
  );
}

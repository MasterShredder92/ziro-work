"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Form,
  FormField,
  FormSubmissionAnswer,
  FormValidationIssue,
} from "@/lib/forms/types";

export type FormRunnerProps = {
  form: Form;
  fields: FormField[];
};

type Values = Record<string, unknown>;

function initialValues(fields: FormField[]): Values {
  const out: Values = {};
  for (const f of fields) {
    if (f.defaultValue !== undefined && f.defaultValue !== null) {
      out[f.fieldKey] = f.defaultValue;
    } else if (f.fieldType === "multiselect") {
      out[f.fieldKey] = [];
    } else if (f.fieldType === "boolean" || f.fieldType === "checkbox") {
      out[f.fieldKey] = false;
    } else {
      out[f.fieldKey] = "";
    }
  }
  return out;
}

export function FormRunner({ form, fields }: FormRunnerProps) {
  const router = useRouter();
  const orderedFields = useMemo(
    () => [...fields].sort((a, b) => a.position - b.position),
    [fields],
  );
  const [values, setValues] = useState<Values>(() =>
    initialValues(orderedFields),
  );
  const [issues, setIssues] = useState<FormValidationIssue[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setValue = (key: string, value: unknown) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setIssues([]);
    try {
      const answers: FormSubmissionAnswer[] = orderedFields.map((f) => ({
        fieldId: f.id,
        fieldKey: f.fieldKey,
        label: f.label,
        value: values[f.fieldKey],
      }));

      const res = await fetch("/forms/api/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          formId: form.id,
          tenantId: form.tenantId,
          answers,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        validation?: { issues?: FormValidationIssue[] };
        redirectUrl?: string | null;
        message?: string | null;
        error?: string;
      };

      if (!res.ok) {
        if (body?.validation?.issues?.length) {
          setIssues(body.validation.issues);
          return;
        }
        throw new Error(body?.error ?? `Submission failed (${res.status})`);
      }

      if (body.validation?.issues?.length) {
        setIssues(body.validation.issues);
        return;
      }

      if (body.redirectUrl) {
        window.location.href = body.redirectUrl;
        return;
      }

      setSuccess(body.message ?? form.successMessage ?? "Thanks! Your response was recorded.");
      setValues(initialValues(orderedFields));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const issueByField = new Map<string, FormValidationIssue>();
  for (const i of issues) {
    if (i.fieldKey) issueByField.set(i.fieldKey, i);
  }

  if (success) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-[#00ff88]/40 bg-[#00ff88]/5 p-6 text-center space-y-2">
        <div className="text-lg font-semibold text-[var(--z-fg)]">Thank you!</div>
        <div className="text-sm text-[var(--z-muted)]">{success}</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
          {form.name}
        </h1>
        {form.description ? (
          <p className="mt-1 text-sm text-[var(--z-muted)]">
            {form.description}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {orderedFields.map((field) => {
          const issue = issueByField.get(field.fieldKey);
          const labelEl = (
            <label className="text-sm font-medium text-[var(--z-fg)]">
              {field.label}
              {field.required ? (
                <span className="text-red-400 ml-1">*</span>
              ) : null}
            </label>
          );

          return (
            <div key={field.id} className="space-y-1">
              {labelEl}
              {renderInput(field, values[field.fieldKey], (v) =>
                setValue(field.fieldKey, v),
              )}
              {field.helpText ? (
                <div className="text-xs text-[var(--z-muted)]">
                  {field.helpText}
                </div>
              ) : null}
              {issue ? (
                <div className="text-xs text-red-400">{issue.message}</div>
              ) : null}
            </div>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-[var(--z-radius-md)] border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-[var(--z-radius-md)] bg-[#00ff88] text-black font-semibold px-4 py-2 text-sm hover:bg-[#00e679] disabled:opacity-60"
      >
        {submitting ? "Submitting…" : form.submitLabel || "Submit"}
      </button>
    </form>
  );
}

function renderInput(
  field: FormField,
  value: unknown,
  onChange: (v: unknown) => void,
) {
  const inputCls =
    "w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm";
  const ftype = String(field.fieldType);
  const stringValue = typeof value === "string" ? value : value == null ? "" : String(value);

  switch (ftype) {
    case "textarea":
      return (
        <textarea
          rows={4}
          value={stringValue}
          placeholder={field.placeholder ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );
    case "select":
      return (
        <select
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        >
          <option value="">{field.placeholder ?? "Choose…"}</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "radio":
      return (
        <div className="space-y-1">
          {(field.options ?? []).map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={field.fieldKey}
                value={o.value}
                checked={stringValue === o.value}
                onChange={() => onChange(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    case "multiselect": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="space-y-1">
          {(field.options ?? []).map((o) => {
            const checked = arr.includes(o.value);
            return (
              <label
                key={o.value}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...arr, o.value]);
                    else onChange(arr.filter((v) => v !== o.value));
                  }}
                />
                {o.label}
              </label>
            );
          })}
        </div>
      );
    }
    case "boolean":
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
          />
          {field.placeholder ?? "Confirm"}
        </label>
      );
    case "date":
      return (
        <input
          type="date"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );
    case "datetime":
      return (
        <input
          type="datetime-local"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );
    case "number":
    case "rating":
      return (
        <input
          type="number"
          value={stringValue}
          placeholder={field.placeholder ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );
    case "email":
      return (
        <input
          type="email"
          value={stringValue}
          placeholder={field.placeholder ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );
    case "phone":
      return (
        <input
          type="tel"
          value={stringValue}
          placeholder={field.placeholder ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );
    case "url":
      return (
        <input
          type="url"
          value={stringValue}
          placeholder={field.placeholder ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );
    case "hidden":
      return (
        <input
          type="hidden"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (
        <input
          type="text"
          value={stringValue}
          placeholder={field.placeholder ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      );
  }
}

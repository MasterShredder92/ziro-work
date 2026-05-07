"use client";

import type {
  FormField,
  FormFieldInput,
  FormFieldOption,
  FormValidationRule,
} from "@/lib/forms/types";
import { FIELD_TYPES } from "@/lib/forms/types";

export type EditableField = FormFieldInput & { id: string };

export type FieldEditorProps = {
  field: EditableField;
  onUpdate: (next: EditableField) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

const TYPE_LABELS: Record<string, string> = {
  text: "Text",
  textarea: "Long text",
  email: "Email",
  phone: "Phone",
  number: "Number",
  date: "Date",
  datetime: "Date & time",
  select: "Dropdown",
  multiselect: "Multi-select",
  radio: "Radio",
  checkbox: "Checkbox",
  boolean: "Yes/No",
  rating: "Rating",
  url: "URL",
  hidden: "Hidden",
};

export function fieldFromRecord(record: FormField): EditableField {
  return {
    id: record.id,
    sectionId: record.sectionId,
    sectionTitle: record.sectionTitle,
    fieldKey: record.fieldKey,
    label: record.label,
    fieldType: record.fieldType,
    placeholder: record.placeholder,
    helpText: record.helpText,
    required: record.required,
    position: record.position,
    options: record.options,
    validationRules: record.validationRules,
    defaultValue: record.defaultValue,
    metadata: record.metadata,
  };
}

export function FieldEditor({
  field,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: FieldEditorProps) {
  const hasOptions = ["select", "multiselect", "radio"].includes(
    String(field.fieldType),
  );

  const update = (patch: Partial<EditableField>) =>
    onUpdate({ ...field, ...patch });

  const addOption = () => {
    const next: FormFieldOption[] = [
      ...(field.options ?? []),
      {
        value: `option-${(field.options?.length ?? 0) + 1}`,
        label: "New option",
      },
    ];
    update({ options: next });
  };

  const updateOption = (idx: number, patch: Partial<FormFieldOption>) => {
    const next = (field.options ?? []).map((o, i) =>
      i === idx ? { ...o, ...patch } : o,
    );
    update({ options: next });
  };

  const removeOption = (idx: number) => {
    const next = (field.options ?? []).filter((_, i) => i !== idx);
    update({ options: next });
  };

  const addValidation = (kind: FormValidationRule["kind"]) => {
    const defaults: Record<FormValidationRule["kind"], FormValidationRule> = {
      required: { kind: "required" },
      min: { kind: "min", value: 0 },
      max: { kind: "max", value: 0 },
      minLength: { kind: "minLength", value: 1 },
      maxLength: { kind: "maxLength", value: 255 },
      pattern: { kind: "pattern", value: ".*" },
      email: { kind: "email" },
      url: { kind: "url" },
      equals: { kind: "equals", value: "" },
      custom: { kind: "custom" },
    };
    update({
      validationRules: [...(field.validationRules ?? []), defaults[kind]],
    });
  };

  const removeValidation = (idx: number) => {
    const next = (field.validationRules ?? []).filter((_, i) => i !== idx);
    update({ validationRules: next });
  };

  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Field
        </div>
        <div className="flex items-center gap-1">
          {onMoveUp ? (
            <button
              type="button"
              onClick={onMoveUp}
              className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] px-2 py-1"
              aria-label="Move up"
            >
              ↑
            </button>
          ) : null}
          {onMoveDown ? (
            <button
              type="button"
              onClick={onMoveDown}
              className="text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] px-2 py-1"
              aria-label="Move down"
            >
              ↓
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Label
          </span>
          <input
            value={field.label}
            onChange={(e) => update({ label: e.target.value })}
            className="mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Key
          </span>
          <input
            value={field.fieldKey}
            onChange={(e) =>
              update({
                fieldKey: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]+/g, "_"),
              })
            }
            className="mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm font-mono"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Type
          </span>
          <select
            value={String(field.fieldType)}
            onChange={(e) => update({ fieldType: e.target.value })}
            className="mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t] ?? t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Placeholder
          </span>
          <input
            value={field.placeholder ?? ""}
            onChange={(e) =>
              update({ placeholder: e.target.value || null })
            }
            className="mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Help text
        </span>
        <input
          value={field.helpText ?? ""}
          onChange={(e) => update({ helpText: e.target.value || null })}
          className="mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={field.required === true}
          onChange={(e) => update({ required: e.target.checked })}
        />
        <span className="text-sm text-[var(--z-fg)]">Required</span>
      </label>

      {hasOptions ? (
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Options
          </div>
          {(field.options ?? []).map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                value={opt.label}
                placeholder="Label"
                onChange={(e) => updateOption(idx, { label: e.target.value })}
                className="flex-1 rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-1.5 text-sm"
              />
              <input
                value={opt.value}
                placeholder="Value"
                onChange={(e) => updateOption(idx, { value: e.target.value })}
                className="w-40 rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-1.5 text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => removeOption(idx)}
                className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-xs text-[#c4f036] hover:text-[#00e679]"
          >
            + Add option
          </button>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Validation
          </div>
          <select
            onChange={(e) => {
              if (e.target.value) {
                addValidation(e.target.value as FormValidationRule["kind"]);
                e.target.value = "";
              }
            }}
            defaultValue=""
            className="rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-2 py-1 text-xs"
          >
            <option value="">+ Add rule</option>
            <option value="required">required</option>
            <option value="minLength">minLength</option>
            <option value="maxLength">maxLength</option>
            <option value="min">min</option>
            <option value="max">max</option>
            <option value="pattern">pattern</option>
            <option value="email">email</option>
            <option value="url">url</option>
            <option value="equals">equals</option>
          </select>
        </div>
        {(field.validationRules ?? []).map((rule, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 text-xs text-[var(--z-muted)] font-mono"
          >
            <span className="px-2 py-1 bg-[var(--z-surface-2)] rounded border border-[var(--z-border)]">
              {rule.kind}
              {rule.value !== undefined && rule.value !== null
                ? `: ${String(rule.value)}`
                : ""}
            </span>
            <button
              type="button"
              onClick={() => removeValidation(idx)}
              className="text-red-400 hover:text-red-300"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import type { FormField, Form } from "@/lib/forms/types";

export type FormPreviewProps = {
  form: Pick<Form, "name" | "description" | "submitLabel">;
  fields: FormField[];
};

export function FormPreview({ form, fields }: FormPreviewProps) {
  const ordered = [...fields].sort((a, b) => a.position - b.position);
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-6 space-y-4">
      <div>
        <div className="text-lg font-semibold text-[var(--z-fg)]">
          {form.name || "Untitled form"}
        </div>
        {form.description ? (
          <div className="text-sm text-[var(--z-muted)] mt-1">
            {form.description}
          </div>
        ) : null}
      </div>

      {ordered.length === 0 ? (
        <div className="rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] p-6 text-center text-sm text-[var(--z-muted)]">
          Add fields to preview the form.
        </div>
      ) : (
        <div className="space-y-4">
          {ordered.map((field) => (
            <div key={field.id} className="space-y-1">
              <label className="text-sm font-medium text-[var(--z-fg)]">
                {field.label}
                {field.required ? (
                  <span className="text-red-400 ml-1">*</span>
                ) : null}
              </label>
              {renderField(field)}
              {field.helpText ? (
                <div className="text-xs text-[var(--z-muted)]">
                  {field.helpText}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div>
        <button
          type="button"
          disabled
          className="rounded-[var(--z-radius-md)] bg-[#c4f036] text-black font-semibold px-4 py-2 text-sm opacity-80"
        >
          {form.submitLabel || "Submit"}
        </button>
      </div>
    </div>
  );
}

function renderField(field: FormField) {
  const inputCls =
    "w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm";
  const ftype = String(field.fieldType);
  switch (ftype) {
    case "textarea":
      return (
        <textarea
          disabled
          placeholder={field.placeholder ?? ""}
          className={inputCls}
          rows={4}
        />
      );
    case "select":
      return (
        <select disabled className={inputCls}>
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
              <input type="radio" disabled /> {o.label}
            </label>
          ))}
        </div>
      );
    case "multiselect":
      return (
        <div className="space-y-1">
          {(field.options ?? []).map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm">
              <input type="checkbox" disabled /> {o.label}
            </label>
          ))}
        </div>
      );
    case "boolean":
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled /> {field.placeholder ?? "Confirm"}
        </label>
      );
    case "date":
      return <input type="date" disabled className={inputCls} />;
    case "datetime":
      return <input type="datetime-local" disabled className={inputCls} />;
    case "number":
    case "rating":
      return (
        <input
          type="number"
          disabled
          placeholder={field.placeholder ?? ""}
          className={inputCls}
        />
      );
    case "email":
      return (
        <input
          type="email"
          disabled
          placeholder={field.placeholder ?? ""}
          className={inputCls}
        />
      );
    case "phone":
      return (
        <input
          type="tel"
          disabled
          placeholder={field.placeholder ?? ""}
          className={inputCls}
        />
      );
    case "url":
      return (
        <input
          type="url"
          disabled
          placeholder={field.placeholder ?? ""}
          className={inputCls}
        />
      );
    case "hidden":
      return (
        <div className="text-xs text-[var(--z-muted)] font-mono">
          hidden input
        </div>
      );
    default:
      return (
        <input
          type="text"
          disabled
          placeholder={field.placeholder ?? ""}
          className={inputCls}
        />
      );
  }
}

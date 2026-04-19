"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Form,
  FormField,
  FormStatus,
  FormWithFields,
} from "@/lib/forms/types";
import { FORM_STATUSES } from "@/lib/forms/types";
import { FieldEditor, type EditableField, fieldFromRecord } from "./FieldEditor";
import { FormPreview } from "./FormPreview";

type InitialData =
  | { mode: "create" }
  | { mode: "edit"; bundle: FormWithFields };

export type FormEditorProps = {
  initial: InitialData;
  canWrite: boolean;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  status: FormStatus;
  isPublic: boolean;
  submitLabel: string;
  successMessage: string;
  successRedirectUrl: string;
};

function initialFormState(form?: Form): FormState {
  return {
    name: form?.name ?? "",
    slug: form?.slug ?? "",
    description: form?.description ?? "",
    status: (form?.status as FormStatus) ?? "draft",
    isPublic: form?.isPublic === true,
    submitLabel: form?.submitLabel ?? "",
    successMessage: form?.successMessage ?? "",
    successRedirectUrl: form?.successRedirectUrl ?? "",
  };
}

function toEditableFields(fields: FormField[]): EditableField[] {
  return [...fields]
    .sort((a, b) => a.position - b.position)
    .map(fieldFromRecord);
}

function makeNewField(position: number): EditableField {
  return {
    id: `new-${Math.random().toString(36).slice(2, 10)}`,
    fieldKey: `field_${position + 1}`,
    label: "Untitled field",
    fieldType: "text",
    placeholder: null,
    helpText: null,
    required: false,
    position,
    options: [],
    validationRules: [],
    defaultValue: null,
    metadata: {},
  };
}

export function FormEditor({ initial, canWrite }: FormEditorProps) {
  const router = useRouter();
  const isEditing = initial.mode === "edit";
  const bundle = isEditing ? initial.bundle : null;
  const formId = bundle?.form.id ?? null;

  const [state, setState] = useState<FormState>(
    initialFormState(bundle?.form),
  );
  const [fields, setFields] = useState<EditableField[]>(
    bundle ? toEditableFields(bundle.fields) : [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<FormState>) =>
    setState((s) => ({ ...s, ...patch }));

  const addField = () =>
    setFields((fs) => [...fs, makeNewField(fs.length)]);

  const updateField = (idx: number, next: EditableField) =>
    setFields((fs) => fs.map((f, i) => (i === idx ? next : f)));

  const deleteField = (idx: number) =>
    setFields((fs) =>
      fs.filter((_, i) => i !== idx).map((f, i) => ({ ...f, position: i })),
    );

  const moveField = (idx: number, dir: -1 | 1) =>
    setFields((fs) => {
      const next = [...fs];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return fs;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((f, i) => ({ ...f, position: i }));
    });

  const handleSave = async () => {
    if (!canWrite) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        form: {
          name: state.name,
          slug: state.slug || null,
          description: state.description || null,
          status: state.status,
          isPublic: state.isPublic,
          submitLabel: state.submitLabel || null,
          successMessage: state.successMessage || null,
          successRedirectUrl: state.successRedirectUrl || null,
        },
        fields: fields.map((f, i) => ({
          ...f,
          id: f.id.startsWith("new-") ? undefined : f.id,
          position: i,
        })),
      };

      const url = formId ? `/forms/api/${formId}` : "/forms/api/list";
      const method = formId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      const body = (await res.json()) as { id?: string };
      router.push(formId ? `/forms/${formId}` : `/forms/${body.id ?? ""}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canWrite || !formId) return;
    if (!confirm("Delete this form and all its fields?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/forms/api/${formId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      router.push("/forms");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete form");
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_520px] gap-6">
      <div className="space-y-4">
        <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                Name
              </span>
              <input
                value={state.name}
                onChange={(e) => update({ name: e.target.value })}
                className="mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                Slug
              </span>
              <input
                value={state.slug}
                onChange={(e) =>
                  update({
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]+/g, "-"),
                  })
                }
                placeholder="intake-form"
                className="mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm font-mono"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Description
            </span>
            <textarea
              value={state.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                Status
              </span>
              <select
                value={state.status}
                onChange={(e) =>
                  update({ status: e.target.value as FormStatus })
                }
                className="mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm capitalize"
              >
                {FORM_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-end gap-2 pb-1">
              <input
                type="checkbox"
                checked={state.isPublic}
                onChange={(e) => update({ isPublic: e.target.checked })}
              />
              <span className="text-sm text-[var(--z-fg)]">Public</span>
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                Submit label
              </span>
              <input
                value={state.submitLabel}
                onChange={(e) => update({ submitLabel: e.target.value })}
                placeholder="Submit"
                className="mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                Redirect URL
              </span>
              <input
                value={state.successRedirectUrl}
                onChange={(e) =>
                  update({ successRedirectUrl: e.target.value })
                }
                placeholder="https://…"
                className="mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Thank-you message
            </span>
            <textarea
              value={state.successMessage}
              onChange={(e) => update({ successMessage: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-[var(--z-radius-md)] bg-[var(--z-surface-2)] border border-[var(--z-border)] px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-[var(--z-fg)]">Fields</div>
          {canWrite ? (
            <button
              type="button"
              onClick={addField}
              className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/5"
            >
              + Add field
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          {fields.length === 0 ? (
            <div className="rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] p-6 text-center text-sm text-[var(--z-muted)]">
              No fields yet — add one to get started.
            </div>
          ) : (
            fields.map((f, idx) => (
              <FieldEditor
                key={f.id}
                field={f}
                onUpdate={(next) => updateField(idx, next)}
                onDelete={() => deleteField(idx)}
                onMoveUp={idx > 0 ? () => moveField(idx, -1) : undefined}
                onMoveDown={
                  idx < fields.length - 1
                    ? () => moveField(idx, 1)
                    : undefined
                }
              />
            ))
          )}
        </div>

        {error ? (
          <div className="rounded-[var(--z-radius-md)] border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          {isEditing && canWrite ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="rounded-[var(--z-radius-md)] border border-red-500/40 bg-transparent px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-60"
            >
              Delete form
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canWrite || saving || !state.name.trim()}
            className="rounded-[var(--z-radius-md)] bg-[#00ff88] text-black font-semibold px-4 py-2 text-sm hover:bg-[#00e679] disabled:opacity-60"
          >
            {saving ? "Saving…" : isEditing ? "Save changes" : "Create form"}
          </button>
        </div>
      </div>

      <div className="xl:sticky xl:top-4 space-y-3">
        <div className="text-sm font-semibold text-[var(--z-fg)]">Preview</div>
        <FormPreview
          form={{
            name: state.name,
            description: state.description,
            submitLabel: state.submitLabel,
          }}
          fields={fields.map(
            (f) =>
              ({
                id: f.id,
                tenantId: bundle?.form.tenantId ?? "",
                formId: bundle?.form.id ?? "",
                sectionId: f.sectionId ?? null,
                sectionTitle: f.sectionTitle ?? null,
                fieldKey: f.fieldKey,
                label: f.label,
                fieldType: f.fieldType,
                placeholder: f.placeholder ?? null,
                helpText: f.helpText ?? null,
                required: f.required === true,
                position: typeof f.position === "number" ? f.position : 0,
                options: f.options ?? [],
                validationRules: f.validationRules ?? [],
                defaultValue: f.defaultValue ?? null,
                metadata: f.metadata ?? {},
                createdAt: "",
                updatedAt: "",
              }) as FormField,
          )}
        />
      </div>
    </div>
  );
}

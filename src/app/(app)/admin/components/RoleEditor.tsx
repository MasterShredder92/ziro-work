"use client";

import { useMemo, useState } from "react";
import type { PermissionBundle } from "@/lib/admin/permissionBundles";
import type {
  BaseRoleKey,
  RoleDefinition,
  RoleInput,
} from "@/lib/admin/adminTypes";

export type RoleEditorProps = {
  tenantId: string;
  initial?: RoleDefinition | null;
  bundles: PermissionBundle[];
  availableRoles: RoleDefinition[];
  canWrite: boolean;
  onSaved?: (role: RoleDefinition) => void;
  onDeleted?: (id: string) => void;
};

const BASE_ROLES: Array<{ key: BaseRoleKey; label: string }> = [
  { key: "admin", label: "Admin" },
  { key: "director", label: "Director" },
  { key: "teacher", label: "Teacher" },
  { key: "student", label: "Student" },
  { key: "family", label: "Family" },
];

export function RoleEditor({
  tenantId,
  initial,
  bundles,
  availableRoles,
  canWrite,
  onSaved,
  onDeleted,
}: RoleEditorProps) {
  const [key, setKey] = useState(initial?.key ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [baseRole, setBaseRole] = useState<BaseRoleKey | "">(
    (initial?.base_role as BaseRoleKey | undefined) ?? "",
  );
  const [inheritsFrom, setInheritsFrom] = useState(
    initial?.inherits_from ?? "",
  );
  const [permissions, setPermissions] = useState<Set<string>>(
    new Set(initial?.permissions ?? []),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = !canWrite || initial?.is_system === true;

  const allPermissions = useMemo(
    () => Array.from(new Set(bundles.flatMap((b) => b.permissions))).sort(),
    [bundles],
  );

  function togglePermission(p: string) {
    const next = new Set(permissions);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setPermissions(next);
  }

  function toggleBundle(bundle: PermissionBundle, nextOn: boolean) {
    const next = new Set(permissions);
    for (const p of bundle.permissions) {
      if (nextOn) next.add(p);
      else next.delete(p);
    }
    setPermissions(next);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body: RoleInput = {
        key: key.trim() || undefined,
        name: name.trim() || undefined,
        description: description || null,
        base_role: (baseRole || null) as BaseRoleKey | null,
        inherits_from: inheritsFrom || null,
        permissions: Array.from(permissions).sort(),
      };
      const url = initial
        ? `/api/admin/roles/${initial.id}?tenantId=${encodeURIComponent(tenantId)}`
        : `/api/admin/roles?tenantId=${encodeURIComponent(tenantId)}`;
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as {
        data?: RoleDefinition;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      if (data?.data) onSaved?.(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!initial) return;
    if (!confirm(`Delete role "${initial.name}"? This cannot be undone.`)) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/roles/${initial.id}?tenantId=${encodeURIComponent(tenantId)}`,
        { method: "DELETE" },
      );
      if (!res.ok && res.status !== 204) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      onDeleted?.(initial.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete role");
    } finally {
      setSaving(false);
    }
  }

  const filterableRoles = availableRoles.filter(
    (r) => !initial || r.id !== initial.id,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Key">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={disabled}
            className="h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm"
            placeholder="e.g. studio-lead"
          />
        </Field>
        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled}
            className="h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm"
            placeholder="Display name"
          />
        </Field>
      </div>
      <Field label="Description">
        <textarea
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          disabled={disabled}
          rows={2}
          className="w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 text-sm"
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Base role (inherits system perms)">
          <select
            value={baseRole}
            onChange={(e) => setBaseRole(e.target.value as BaseRoleKey | "")}
            disabled={disabled}
            className="h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm"
          >
            <option value="">None</option>
            {BASE_ROLES.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Inherits from role">
          <select
            value={inheritsFrom ?? ""}
            onChange={(e) => setInheritsFrom(e.target.value)}
            disabled={disabled}
            className="h-9 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm"
          >
            <option value="">None</option>
            {filterableRoles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <div className="text-sm font-semibold text-[var(--z-fg)]">
          Permissions ({permissions.size}/{allPermissions.length})
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {bundles.map((bundle) => {
            const allOn = bundle.permissions.every((p) => permissions.has(p));
            const someOn = bundle.permissions.some((p) => permissions.has(p));
            return (
              <div
                key={bundle.key}
                className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">{bundle.label}</div>
                  <label className="flex items-center gap-1 text-xs text-[var(--z-muted)]">
                    <input
                      type="checkbox"
                      checked={allOn}
                      ref={(el) => {
                        if (el) el.indeterminate = !allOn && someOn;
                      }}
                      disabled={disabled}
                      onChange={(e) => toggleBundle(bundle, e.target.checked)}
                    />
                    all
                  </label>
                </div>
                <div className="flex flex-col gap-1">
                  {bundle.permissions.map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-2 font-mono text-xs text-[var(--z-fg)]"
                    >
                      <input
                        type="checkbox"
                        checked={permissions.has(p)}
                        disabled={disabled}
                        onChange={() => togglePermission(p)}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error ? (
        <div className="rounded-[var(--z-radius-md)] border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={disabled || saving}
          className="h-9 rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-4 text-sm font-semibold text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Create role"}
        </button>
        {initial && !initial.is_system ? (
          <button
            type="button"
            onClick={remove}
            disabled={disabled || saving}
            className="h-9 rounded-[var(--z-radius-md)] border border-red-500/40 px-4 text-sm text-red-400 disabled:opacity-50"
          >
            Delete role
          </button>
        ) : null}
        {initial?.is_system ? (
          <span className="text-xs text-[var(--z-muted)]">
            System roles are read-only.
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

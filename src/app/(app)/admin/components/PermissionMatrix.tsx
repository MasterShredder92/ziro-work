"use client";

import { useMemo, useState } from "react";
import type {
  PermissionBundle,
} from "@/lib/admin/permissionBundles";
import type { RoleSummary } from "@/lib/admin/adminTypes";

export type PermissionMatrixProps = {
  bundles: PermissionBundle[];
  roles: RoleSummary[];
  canWrite: boolean;
  onToggle?: (roleId: string, permission: string, next: boolean) => void;
};

export function PermissionMatrix({
  bundles,
  roles,
  canWrite,
  onToggle,
}: PermissionMatrixProps) {
  const [filter, setFilter] = useState("");
  const lower = filter.trim().toLowerCase();

  const filteredBundles = useMemo(() => {
    if (!lower) return bundles;
    return bundles
      .map((b) => ({
        ...b,
        permissions: b.permissions.filter(
          (p) => p.toLowerCase().includes(lower) || b.label.toLowerCase().includes(lower),
        ),
      }))
      .filter((b) => b.permissions.length > 0);
  }, [bundles, lower]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter permissions…"
          className="h-9 w-full max-w-sm rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)]"
        />
      </div>
      <div className="overflow-auto rounded-[var(--z-radius-md)] border border-[var(--z-border)]">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-[var(--z-surface)] text-left text-[var(--z-muted)]">
            <tr>
              <th className="sticky left-0 z-10 bg-[var(--z-surface)] px-3 py-2 font-semibold">
                Permission
              </th>
              {roles.map((r) => (
                <th
                  key={r.role.id}
                  className="px-3 py-2 font-semibold whitespace-nowrap"
                >
                  {r.role.name}
                  <div className="text-[10px] font-normal text-[var(--z-muted)]">
                    {r.role.key}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredBundles.map((bundle) => (
              <BundleRows
                key={bundle.key}
                bundle={bundle}
                roles={roles}
                canWrite={canWrite}
                onToggle={onToggle}
              />
            ))}
            {filteredBundles.length === 0 ? (
              <tr>
                <td
                  colSpan={roles.length + 1}
                  className="px-3 py-6 text-center text-[var(--z-muted)]"
                >
                  No permissions match your filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BundleRows({
  bundle,
  roles,
  canWrite,
  onToggle,
}: {
  bundle: PermissionBundle;
  roles: RoleSummary[];
  canWrite: boolean;
  onToggle?: (roleId: string, permission: string, next: boolean) => void;
}) {
  return (
    <>
      <tr className="bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] text-[var(--z-fg)]">
        <td
          className="sticky left-0 z-10 bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] px-3 py-2 font-semibold"
          colSpan={roles.length + 1}
        >
          {bundle.label}
        </td>
      </tr>
      {bundle.permissions.map((permission) => (
        <tr
          key={permission}
          className="border-t border-[var(--z-border)]"
        >
          <td className="sticky left-0 z-10 bg-[var(--z-bg)] px-3 py-2 font-mono text-xs text-[var(--z-muted)]">
            {permission}
          </td>
          {roles.map((r) => {
            const has = r.effectivePermissions.includes(permission);
            return (
              <td key={r.role.id} className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={has}
                  disabled={!canWrite || r.role.is_system}
                  onChange={(e) =>
                    onToggle?.(r.role.id, permission, e.target.checked)
                  }
                  aria-label={`${r.role.name} / ${permission}`}
                />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}

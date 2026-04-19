"use client";

import { useTransition } from "react";
import type { Role } from "@/lib/auth/roles";
import { roleHierarchy } from "@/lib/auth/roles";
import { setImpersonatedRoleAction } from "./roleSwitcherActions";

export interface RoleSwitcherProps {
  baseRole: Role;
  currentRole: Role;
  isImpersonating: boolean;
}

export function RoleSwitcher({
  baseRole,
  currentRole,
  isImpersonating,
}: RoleSwitcherProps) {
  const [pending, startTransition] = useTransition();

  if (baseRole !== "admin" && baseRole !== "director") return null;

  const allOptions: Role[] = ["admin", "director", "teacher", "family", "student"];
  const selectable = allOptions.filter(
    (r) => roleHierarchy[r] < roleHierarchy[baseRole],
  );

  const value = isImpersonating ? currentRole : "__clear__";

  const onChange = (next: string) => {
    startTransition(async () => {
      try {
        await setImpersonatedRoleAction(next === "__clear__" ? null : next);
      } catch {
        return;
      }
    });
  };

  return (
    <label className="inline-flex items-center gap-2 text-xs text-[var(--z-muted)]">
      <span className="uppercase tracking-wider">Impersonate</span>
      <select
        value={value}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-2 text-xs text-[var(--z-fg)]"
        aria-label="Impersonate role"
      >
        <option value="__clear__">Off ({baseRole})</option>
        {selectable.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {isImpersonating ? (
        <span
          className="rounded-full bg-[color-mix(in_oklab,var(--z-accent),transparent_70%)] px-2 py-0.5 text-[10px] font-semibold text-[var(--z-accent)]"
          aria-live="polite"
        >
          as {currentRole}
        </span>
      ) : null}
    </label>
  );
}

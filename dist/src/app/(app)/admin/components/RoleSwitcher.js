"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTransition } from "react";
import { roleHierarchy } from "@/lib/auth/roles";
import { setImpersonatedRoleAction } from "./roleSwitcherActions";
export function RoleSwitcher({ baseRole, currentRole, isImpersonating, }) {
    const [pending, startTransition] = useTransition();
    if (baseRole !== "admin" && baseRole !== "director")
        return null;
    const allOptions = ["admin", "director", "teacher", "family", "student"];
    const selectable = allOptions.filter((r) => roleHierarchy[r] < roleHierarchy[baseRole]);
    const value = isImpersonating ? currentRole : "__clear__";
    const onChange = (next) => {
        startTransition(async () => {
            try {
                await setImpersonatedRoleAction(next === "__clear__" ? null : next);
            }
            catch (_a) {
                return;
            }
        });
    };
    return (_jsxs("label", { className: "inline-flex items-center gap-2 text-xs text-[var(--z-muted)]", children: [_jsx("span", { className: "uppercase tracking-wider", children: "Impersonate" }), _jsxs("select", { value: value, disabled: pending, onChange: (e) => onChange(e.target.value), className: "h-8 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-2 text-xs text-[var(--z-fg)]", "aria-label": "Impersonate role", children: [_jsxs("option", { value: "__clear__", children: ["Off (", baseRole, ")"] }), selectable.map((r) => (_jsx("option", { value: r, children: r }, r)))] }), isImpersonating ? (_jsxs("span", { className: "rounded-full bg-[color-mix(in_oklab,var(--z-accent),transparent_70%)] px-2 py-0.5 text-[10px] font-semibold text-[var(--z-accent)]", "aria-live": "polite", children: ["as ", currentRole] })) : null] }));
}

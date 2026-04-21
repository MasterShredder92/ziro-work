"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";
export function GlobalSearchInput({ value, onChange, onSelect, placeholder = "Search students, families, invoices…", autoFocus, debounceMs = 220, }) {
    const [draft, setDraft] = React.useState(value);
    const timer = React.useRef(null);
    React.useEffect(() => setDraft(value), [value]);
    React.useEffect(() => {
        if (timer.current)
            clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            onChange(draft);
        }, debounceMs);
        return () => {
            if (timer.current)
                clearTimeout(timer.current);
        };
    }, [draft, debounceMs, onChange]);
    return (_jsx("input", { type: "search", autoComplete: "off", autoFocus: autoFocus, value: draft, onChange: (e) => setDraft(e.target.value), onKeyDown: (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                onSelect === null || onSelect === void 0 ? void 0 : onSelect();
            }
        }, placeholder: placeholder, className: cn("w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)]", "px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)]", "transition-[box-shadow,border-color] duration-150", "focus-visible:border-[color-mix(in_oklab,var(--z-accent),transparent_35%)]", "focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--z-accent),transparent_78%)]", focusRingClassName()) }));
}

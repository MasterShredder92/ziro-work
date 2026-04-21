"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, } from "react";
export function ThreadSearchBar({ onDebouncedQueryChange, matchTotal, activeIndex, onPrev, onNext, onJumpFirst, disabled, }) {
    const [value, setValue] = useState("");
    const debounceRef = useRef(null);
    const flushDebounced = useCallback((q) => {
        if (debounceRef.current)
            clearTimeout(debounceRef.current);
        debounceRef.current = null;
        onDebouncedQueryChange(q.trim());
    }, [onDebouncedQueryChange]);
    useEffect(() => {
        if (debounceRef.current)
            clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            debounceRef.current = null;
            onDebouncedQueryChange(value.trim());
        }, 120);
        return () => {
            if (debounceRef.current)
                clearTimeout(debounceRef.current);
        };
    }, [value, onDebouncedQueryChange]);
    const clear = useCallback(() => {
        setValue("");
        flushDebounced("");
    }, [flushDebounced]);
    const onKeyDown = (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            clear();
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            onJumpFirst();
            return;
        }
        if (e.key === "ArrowDown" && matchTotal > 0) {
            e.preventDefault();
            onNext();
            return;
        }
        if (e.key === "ArrowUp" && matchTotal > 0) {
            e.preventDefault();
            onPrev();
        }
    };
    const counter = value.trim().length === 0
        ? "—"
        : matchTotal === 0
            ? "0 / 0"
            : `${activeIndex + 1} / ${matchTotal}`;
    return (_jsxs("div", { className: "flex flex-wrap items-center gap-2 border-b border-[var(--z-border)] bg-[var(--z-surface)] pb-2 pt-1", children: [_jsxs("div", { className: "relative flex min-w-[160px] flex-1 items-center gap-2 sm:min-w-[220px]", children: [_jsx(Search, { className: "pointer-events-none absolute left-2.5 size-4 text-[var(--z-muted)]", "aria-hidden": true }), _jsx("input", { type: "search", value: value, disabled: disabled, onChange: (e) => setValue(e.target.value), onKeyDown: onKeyDown, placeholder: "Search messages\u2026", className: "w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] py-1.5 pl-9 pr-8 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--z-accent)] disabled:opacity-50", "aria-label": "Search messages in this thread" }), value.trim().length > 0 ? (_jsx("button", { type: "button", onClick: clear, className: "absolute right-2 rounded p-0.5 text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)]", "aria-label": "Clear search", children: _jsx(X, { className: "size-4" }) })) : null] }), _jsx("span", { className: "min-w-[3.5rem] text-center text-xs tabular-nums text-[var(--z-muted)]", children: counter }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { type: "button", onClick: onPrev, disabled: disabled || matchTotal === 0, className: "rounded border border-[var(--z-border)] bg-[var(--z-bg)] p-1.5 text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)] disabled:cursor-not-allowed disabled:opacity-40", "aria-label": "Previous match", children: _jsx(ChevronUp, { className: "size-4" }) }), _jsx("button", { type: "button", onClick: onNext, disabled: disabled || matchTotal === 0, className: "rounded border border-[var(--z-border)] bg-[var(--z-bg)] p-1.5 text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)] disabled:cursor-not-allowed disabled:opacity-40", "aria-label": "Next match", children: _jsx(ChevronDown, { className: "size-4" }) })] })] }));
}

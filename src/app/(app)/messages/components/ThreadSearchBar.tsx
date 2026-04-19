"use client";

import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type ThreadSearchBarProps = {
  onDebouncedQueryChange: (query: string) => void;
  matchTotal: number;
  activeIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onJumpFirst: () => void;
  disabled?: boolean;
};

export function ThreadSearchBar({
  onDebouncedQueryChange,
  matchTotal,
  activeIndex,
  onPrev,
  onNext,
  onJumpFirst,
  disabled,
}: ThreadSearchBarProps) {
  const [value, setValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushDebounced = useCallback(
    (q: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = null;
      onDebouncedQueryChange(q.trim());
    },
    [onDebouncedQueryChange],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      onDebouncedQueryChange(value.trim());
    }, 120);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, onDebouncedQueryChange]);

  const clear = useCallback(() => {
    setValue("");
    flushDebounced("");
  }, [flushDebounced]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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

  const counter =
    value.trim().length === 0
      ? "—"
      : matchTotal === 0
        ? "0 / 0"
        : `${activeIndex + 1} / ${matchTotal}`;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--z-border)] bg-[var(--z-surface)] pb-2 pt-1">
      <div className="relative flex min-w-[160px] flex-1 items-center gap-2 sm:min-w-[220px]">
        <Search
          className="pointer-events-none absolute left-2.5 size-4 text-[var(--z-muted)]"
          aria-hidden
        />
        <input
          type="search"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search messages…"
          className="w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] py-1.5 pl-9 pr-8 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--z-accent)] disabled:opacity-50"
          aria-label="Search messages in this thread"
        />
        {value.trim().length > 0 ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 rounded p-0.5 text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)]"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-[var(--z-muted)]">
        {counter}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={disabled || matchTotal === 0}
          className="rounded border border-[var(--z-border)] bg-[var(--z-bg)] p-1.5 text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous match"
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={disabled || matchTotal === 0}
          className="rounded border border-[var(--z-border)] bg-[var(--z-bg)] p-1.5 text-[var(--z-muted)] hover:bg-[var(--z-surface-hover)] hover:text-[var(--z-fg)] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next match"
        >
          <ChevronDown className="size-4" />
        </button>
      </div>
    </div>
  );
}

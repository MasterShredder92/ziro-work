import clsx from "clsx";

export function cn(...values: Array<string | undefined | null | false>) {
  return clsx(values);
}

export function focusRingClassName() {
  return "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--z-accent),transparent_40%)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--z-bg)]";
}


"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { Button } from "@/components/ui/Button";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  /** Optional max-width for the dialog panel (Tailwind classes). */
  panelClassName?: string;
};

export function Modal({ open, onClose, title, children, panelClassName }: ModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (open) {
      setLeaving(false);
      setVisible(true);
      return;
    }
    if (visible) {
      setLeaving(true);
      const t = window.setTimeout(() => {
        setVisible(false);
        setLeaving(false);
      }, 240);
      return () => window.clearTimeout(t);
    }
  }, [open, visible]);

  React.useEffect(() => {
    if (!visible) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, onClose]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity",
          leaving ? "opacity-0" : "opacity-100",
        )}
        style={{ transitionDuration: "var(--z-duration-fast)", transitionTimingFunction: "var(--z-ease-smooth)" }}
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center p-[var(--z-space-6)]">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "z-modal-panel w-full max-w-lg rounded-[var(--z-radius-lg)] border bg-[var(--z-surface)]",
            "border-[color-mix(in_oklab,var(--z-accent),transparent_75%)]",
            "shadow-[0_12px_50px_rgba(0,0,0,0.55)]",
            leaving ? "z-modal-panel--out" : "z-modal-panel--in",
            panelClassName,
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--z-border)] px-[var(--z-space-5)] py-[var(--z-space-4)]">
            <div className="min-w-0">
              {title ? (
                <div className="truncate text-sm font-extrabold text-[var(--z-fg)]">{title}</div>
              ) : (
                <div className="text-sm font-extrabold text-[var(--z-fg)]">Modal</div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={cn("h-8 px-2", focusRingClassName())}
            >
              Close
            </Button>
          </div>
          <div className="px-[var(--z-space-5)] py-[var(--z-space-5)]">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

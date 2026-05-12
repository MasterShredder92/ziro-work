"use client";

import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FAMILY_HUB_MODULES } from "./_family-hub-canvas";
import { FamilySectionPanel, type FamilyWorkspaceTab } from "./_content";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const DURATION_MS = 420;

function moduleMeta(tab: FamilyWorkspaceTab) {
  return FAMILY_HUB_MODULES.find((m) => m.id === tab) ?? FAMILY_HUB_MODULES[0];
}

export function FamilySectionExpandOverlay({
  open,
  tab,
  originRect,
  familyId,
  brandColor,
  onRequestClose,
}: {
  open: boolean;
  tab: FamilyWorkspaceTab;
  originRect: DOMRect | null;
  familyId: string;
  brandColor: string;
  onRequestClose: () => void;
}) {
  const [portalHost, setPortalHost] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [originPx, setOriginPx] = useState({ x: "50%", y: "50%" });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setPortalHost(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setExpanded(false);
      return;
    }
    const sheet = sheetRef.current;
    if (!sheet) return;

    const b = sheet.getBoundingClientRect();
    const cx = originRect
      ? originRect.left + originRect.width / 2
      : typeof window !== "undefined"
        ? window.innerWidth / 2
        : b.left + b.width / 2;
    const cy = originRect
      ? originRect.top + originRect.height / 2
      : typeof window !== "undefined"
        ? window.innerHeight / 2
        : b.top + b.height / 2;

    setOriginPx({ x: `${cx - b.left}px`, y: `${cy - b.top}px` });
    setExpanded(false);

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setExpanded(true));
    });
    return () => cancelAnimationFrame(id);
  }, [open, tab, originRect]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onRequestClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onRequestClose]);

  if (!portalHost || typeof document === "undefined" || !open) return null;

  const mod = moduleMeta(tab);

  return createPortal(
    <div
      className="fixed inset-0 z-[380] flex items-stretch justify-stretch p-1 sm:p-3 md:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="family-overlay-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default border-0 bg-black/70 backdrop-blur-[3px] transition-opacity duration-300 light-theme:bg-black/45"
        style={{
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? "auto" : "none",
        }}
        aria-label="Close panel"
        onClick={onRequestClose}
      />

      <div
        ref={sheetRef}
        className="relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[var(--z-surface)] shadow-[0_24px_80px_rgba(0,0,0,0.55)] light-theme:border-[var(--z-border)] light-theme:shadow-2xl"
        style={{
          transformOrigin: `${originPx.x} ${originPx.y}`,
          transform: expanded ? "scale(1)" : "scale(0.07)",
          opacity: expanded ? 1 : 0.88,
          transition: `transform ${DURATION_MS}ms ${EASE}, opacity 280ms ease`,
          willChange: "transform",
        }}
      >
        <header
          className="flex shrink-0 items-center gap-3 border-b border-[var(--z-border)] px-4 py-3 sm:px-5"
          style={{
            background: `linear-gradient(90deg, color-mix(in oklab, ${mod.color}, transparent 92%), transparent)`,
          }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--z-muted)]">{mod.num} · Module</p>
            <h2 id="family-overlay-title" className="truncate text-base font-bold text-[var(--z-fg)] sm:text-lg">
              {mod.label}
            </h2>
            <p className="truncate text-xs text-[var(--z-muted)]">{mod.sub}</p>
          </div>
          <button
            type="button"
            onClick={onRequestClose}
            className="shrink-0 rounded-xl border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm font-semibold text-[var(--z-fg)] transition hover:bg-[var(--z-surface)]"
          >
            Close
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <FamilySectionPanel tab={tab} familyId={familyId} brandColor={brandColor} />
        </div>
      </div>
    </div>,
    document.body
  );
}

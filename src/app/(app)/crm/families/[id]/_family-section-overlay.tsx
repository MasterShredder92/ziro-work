"use client";

import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FAMILY_HUB_MODULES } from "./_family-hub-canvas";
import { FamilySectionPanel, type FamilyWorkspaceTab } from "./_content";
import { OBSIDIAN_DARK_BACKDROP } from "@/lib/ui/obsidianShellBackdrop";

const EASE = "cubic-bezier(0.2, 0.85, 0.25, 1)";
const DURATION_MS = 520;

function moduleMeta(tab: FamilyWorkspaceTab) {
  return FAMILY_HUB_MODULES.find((m) => m.id === tab) ?? FAMILY_HUB_MODULES[0];
}

function computeStartClip(originRect: DOMRect | null): string {
  if (typeof window === "undefined") {
    return "inset(44% 44% 44% 44% round 28px)";
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!originRect || originRect.width < 4 || originRect.height < 4) {
    const t = Math.round(vh * 0.36);
    const s = Math.round(vw * 0.36);
    return `inset(${t}px ${s}px ${t}px ${s}px round 28px)`;
  }
  const top = Math.max(0, originRect.top);
  const left = Math.max(0, originRect.left);
  const right = Math.max(0, vw - originRect.right);
  const bottom = Math.max(0, vh - originRect.bottom);
  return `inset(${top}px ${right}px ${bottom}px ${left}px round 14px)`;
}

const CLIP_FULL = "inset(0px round 0px)";

export function FamilySectionExpandOverlay({
  open,
  tab,
  originRect,
  familyId,
  familyName,
  brandColor,
  onRequestClose,
}: {
  open: boolean;
  tab: FamilyWorkspaceTab;
  originRect: DOMRect | null;
  familyId: string;
  familyName: string;
  brandColor: string;
  onRequestClose: () => void;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [clipPath, setClipPath] = useState(() => computeStartClip(originRect));

  useLayoutEffect(() => {
    if (!open) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setClipPath(CLIP_FULL);
      return;
    }

    const start = computeStartClip(originRect);
    setClipPath(start);

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setClipPath(CLIP_FULL));
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

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open, tab]);

  if (typeof document === "undefined" || !open) return null;

  const mod = moduleMeta(tab);

  return createPortal(
    <div
      role="document"
      aria-labelledby="family-fullpage-title"
      className="pointer-events-auto fixed inset-0 z-[9000] flex h-[100dvh] w-screen max-w-none flex-col overflow-hidden bg-black light-theme:bg-[var(--z-bg)]"
      style={{
        clipPath,
        transition: `clip-path ${DURATION_MS}ms ${EASE}`,
        willChange: "clip-path",
      }}
    >
      <div
        aria-hidden
        className="light-theme:hidden pointer-events-none absolute inset-0 -z-0"
        style={OBSIDIAN_DARK_BACKDROP}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 hidden bg-[var(--z-bg)] light-theme:block"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />
      <div
        className="pointer-events-none absolute -right-24 -top-32 h-[min(520px,55vh)] w-[min(110vw,640px)] rounded-full opacity-[0.14] blur-3xl light-theme:opacity-[0.08]"
        style={{
          background: "radial-gradient(circle at center, rgba(180,255,0,0.45), transparent 72%)",
        }}
        aria-hidden
      />

      <header
        className="relative z-20 flex shrink-0 items-stretch border-b border-white/[0.08] bg-black/55 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl light-theme:border-[var(--z-border)] light-theme:bg-[color-mix(in_oklab,var(--z-surface),transparent_6%)]"
        style={{
          boxShadow: `inset 0 -1px 0 color-mix(in oklab, ${mod.color}, transparent 88%)`,
        }}
      >
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-3 sm:gap-5 sm:px-8 sm:py-4">
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onRequestClose}
            className="group flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.08] light-theme:border-[var(--z-border)] light-theme:bg-[var(--z-surface-2)] light-theme:text-[var(--z-fg)] light-theme:hover:bg-[var(--z-surface)]"
          >
            <span className="text-lg leading-none" aria-hidden>
              ←
            </span>
            <span className="hidden sm:inline">Hub</span>
          </button>

          <div className="h-9 w-px shrink-0 bg-white/[0.1] light-theme:bg-[var(--z-border)]" aria-hidden />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 light-theme:text-[var(--z-muted)]">
              {familyName}
            </p>
            <h1
              id="family-fullpage-title"
              className="truncate text-lg font-bold tracking-tight text-white sm:text-xl light-theme:text-[var(--z-fg)]"
            >
              {mod.label}
            </h1>
            <p className="truncate text-xs text-white/40 light-theme:text-[var(--z-muted)]">{mod.sub}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className="hidden rounded-lg border border-white/[0.08] px-2.5 py-1 font-mono text-[10px] text-white/35 sm:inline light-theme:border-[var(--z-border)] light-theme:text-[var(--z-muted)]"
              aria-hidden
            >
              {mod.num}
            </span>
            <button
              type="button"
              onClick={onRequestClose}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-black shadow-[0_0_0_1px_rgba(255,255,255,0.12)] transition hover:brightness-110 light-theme:shadow-none"
              style={{
                background: `linear-gradient(135deg, color-mix(in oklab, ${brandColor}, white 8%), ${brandColor})`,
              }}
            >
              Done
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 min-h-0 w-screen flex-1 overflow-x-hidden overflow-y-auto overscroll-contain pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
          <FamilySectionPanel tab={tab} familyId={familyId} brandColor={brandColor} />
        </div>
      </main>
    </div>,
    document.body
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/system/PageTransition";

export type FounderLaunchModalProps = {
  open: boolean;
  version: string;
  highlights: string[];
  onAcknowledge: () => void;
};

export function FounderLaunchModal({ open, version, highlights, onAcknowledge }: FounderLaunchModalProps) {
  const router = useRouter();

  const go = React.useCallback(
    (href: string) => {
      onAcknowledge();
      router.push(href);
    },
    [onAcknowledge, router],
  );

  return (
    <Modal
      open={open}
      onClose={onAcknowledge}
      title={`ZiroWork ${version} · Founder note`}
      panelClassName="max-w-lg border border-[color-mix(in_oklab,var(--z-accent),transparent_38%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_88%),0_30px_90px_-40px_rgba(0,0,0,0.85)]"
    >
      <PageTransition>
        <div className="space-y-[var(--z-space-4)] border-l-2 border-[color-mix(in_oklab,var(--z-accent),transparent_22%)] pl-[var(--z-space-4)]">
          <p className="text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_14%)]">
            ZiroWork {version} is our public launch cut—charcoal console, neon signal, and the same discipline we use
            running studios every week. Thank you for riding along while we hardened the spine.
          </p>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--z-accent)]">What&apos;s new</div>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm text-[var(--z-muted)]">
              {highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" variant="primary" size="sm" onClick={() => go("/launch")}>
              See Launch Page
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => go("/help")}>
              Start Tour
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onAcknowledge}>
              Close
            </Button>
          </div>
        </div>
      </PageTransition>
    </Modal>
  );
}

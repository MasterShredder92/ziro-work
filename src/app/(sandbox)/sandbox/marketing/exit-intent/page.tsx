"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

/** Visual QA for the same copy/actions as production ExitIntentModal (without viewport trigger). */
export default function SandboxExitIntentPage() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-extrabold text-[var(--z-fg)]">Exit intent (preview)</h1>
      <p className="text-sm text-[var(--z-muted)]">
        Production modal fires on desktop pointer leaving the top edge of the viewport. Here, open it
        manually.
      </p>
      <Button type="button" variant="primary" onClick={() => setOpen(true)}>
        Open exit modal
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Before you go">
        <p className="text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_35%)]">
          Spin up the charcoal console with seeded data, or jump straight into pricing.
        </p>
        <div className="mt-[var(--z-space-5)] flex flex-col gap-[var(--z-space-3)]">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => {
              setOpen(false);
              router.push("/demo");
            }}
          >
            Try Demo
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full"
            onClick={() => {
              setOpen(false);
              router.push("/pricing");
            }}
          >
            See pricing
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="w-full"
            onClick={() => {
              setOpen(false);
              router.push("/signup");
            }}
          >
            Start free trial
          </Button>
        </div>
      </Modal>
    </div>
  );
}

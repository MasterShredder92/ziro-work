"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "ziro-work-exit-intent-shown";

export function ExitIntentModal() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") return;
    } catch {
      return;
    }

    const desktop =
      window.matchMedia("(pointer: fine)").matches && window.matchMedia("(min-width: 900px)").matches;
    if (!desktop) return;

    const onLeave = (e: MouseEvent) => {
      if (e.clientY > 24) return;
      try {
        if (window.sessionStorage.getItem(STORAGE_KEY) === "1") return;
        window.sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        return;
      }
      setOpen(true);
    };

    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => document.documentElement.removeEventListener("mouseleave", onLeave);
  }, []);

  return (
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
  );
}

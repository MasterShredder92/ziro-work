"use client";

import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export type AnnouncementModalProps = {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
};

export function AnnouncementModal({ open, title, description, onClose }: AnnouncementModalProps) {
  const router = useRouter();
  return (
    <Modal open={open} onClose={onClose} title={title} panelClassName="max-w-md">
      <div className="space-y-[var(--z-space-4)] px-[var(--z-space-5)] py-[var(--z-space-4)]">
        <p className="text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]">{description}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              router.push("/docs/changelog");
            }}
          >
            What&apos;s New
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

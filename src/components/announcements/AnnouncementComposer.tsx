"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn, focusRingClassName } from "@/components/ui/utils";

export type AnnouncementDraft = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
};

export type AnnouncementComposerProps = {
  draft: AnnouncementDraft;
  onSave: (draft: AnnouncementDraft) => void;
};

export function AnnouncementComposer({ draft, onSave }: AnnouncementComposerProps) {
  const [local, setLocal] = React.useState(draft);

  React.useEffect(() => {
    setLocal(draft);
  }, [draft]);

  return (
    <div className="space-y-[var(--z-space-4)]">
      <Input
        label="Title"
        value={local.title}
        onChange={(e) => setLocal((d) => ({ ...d, title: e.target.value }))}
      />
      <div className="flex flex-col gap-[var(--z-space-2)]">
        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">Body</label>
        <textarea
          value={local.body}
          onChange={(e) => setLocal((d) => ({ ...d, body: e.target.value }))}
          rows={8}
          className={cn(
            "min-h-[160px] w-full resize-y rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] py-[var(--z-space-3)] text-sm leading-relaxed text-[var(--z-fg)]",
            "hover:border-[var(--z-border-2)]",
            focusRingClassName(),
          )}
        />
      </div>
      <div className="grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-2">
        <Input
          label="CTA label"
          value={local.ctaLabel}
          onChange={(e) => setLocal((d) => ({ ...d, ctaLabel: e.target.value }))}
        />
        <Input
          label="CTA URL"
          value={local.ctaUrl}
          onChange={(e) => setLocal((d) => ({ ...d, ctaUrl: e.target.value }))}
          placeholder="https://"
        />
      </div>
      <Button type="button" onClick={() => onSave(local)}>
        Save draft
      </Button>
    </div>
  );
}

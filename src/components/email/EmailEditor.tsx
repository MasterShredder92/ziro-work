"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { cn, focusRingClassName } from "@/components/ui/utils";
import type { EmailTemplateModel } from "@/components/email/emailTypes";

export type EmailEditorProps = {
  template: EmailTemplateModel;
  onChange: (next: EmailTemplateModel) => void;
};

export function EmailEditor({ template, onChange }: EmailEditorProps) {
  const [tab, setTab] = React.useState<"edit" | "preview">("edit");

  return (
    <Card padding="none" radius="md" variant="elevated" className="overflow-hidden border-[var(--z-border)]">
      <div className="border-b border-[var(--z-border)] px-[var(--z-space-4)] pt-[var(--z-space-4)]">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-[var(--z-space-3)]">
          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]">Editor</span>
          <Badge variant="neutral" active>
            {template.category}
          </Badge>
        </div>
        <Tabs
          tabs={[
            { id: "edit", label: "Compose" },
            { id: "preview", label: "Preview" },
          ]}
          activeTab={tab}
          onChange={(id) => setTab(id as "edit" | "preview")}
        />
      </div>

      <div className="space-y-[var(--z-space-4)] p-[var(--z-space-5)]">
        {tab === "edit" ? (
          <>
            <Input
              label="Subject / title"
              value={template.title}
              onChange={(e) => onChange({ ...template, title: e.target.value })}
            />
            <div className="flex flex-col gap-[var(--z-space-2)]">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
                Body
              </label>
              <textarea
                value={template.body}
                onChange={(e) => onChange({ ...template, body: e.target.value })}
                rows={12}
                className={cn(
                  "min-h-[220px] w-full resize-y rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] py-[var(--z-space-3)] text-sm leading-relaxed text-[var(--z-fg)] placeholder:text-[color-mix(in_oklab,var(--z-fg),transparent_55%)]",
                  "hover:border-[var(--z-border-2)]",
                  focusRingClassName(),
                )}
                spellCheck={false}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => onChange({ ...template, body: `${template.body}{{studentName}}` })}
              >
                Insert {"{{studentName}}"}
              </Button>
              <span className="self-center text-[10px] text-[var(--z-muted)]">
                Also try {"{{invoiceAmount}}"}, {"{{teacherName}}"}
              </span>
            </div>
          </>
        ) : (
          <div className="space-y-[var(--z-space-3)] rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] p-[var(--z-space-4)]">
            <p className="text-sm font-semibold text-[var(--z-fg)]">{template.title || "Untitled"}</p>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_18%)]">
              {template.body || "Nothing to preview yet."}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AutomationAction,
  AutomationCondition,
  AutomationRule,
  AutomationRuleInput,
  AutomationTrigger,
} from "@/lib/automation/types";
import { TriggerSelector } from "./TriggerSelector";
import { ConditionBuilder } from "./ConditionBuilder";
import { ActionBuilder } from "./ActionBuilder";

export type AutomationEditorProps = {
  rule?: AutomationRule | null;
  tenantId: string;
};

export function AutomationEditor({ rule, tenantId }: AutomationEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [name, setName] = useState(rule?.name ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [trigger, setTrigger] = useState<AutomationTrigger>(
    rule?.trigger ?? { event: "lead.created" },
  );
  const [conditions, setConditions] = useState<AutomationCondition[]>(
    rule?.conditions ?? [],
  );
  const [actions, setActions] = useState<AutomationAction[]>(
    rule?.actions ?? [],
  );

  const save = useCallback(async () => {
    setError(null);
    setStatus(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    const body: AutomationRuleInput = {
      name: name.trim(),
      description: description.trim() ? description.trim() : null,
      enabled,
      trigger,
      conditions,
      actions,
    };

    startTransition(async () => {
      try {
        const url = rule
          ? `/automation/api/rules/${encodeURIComponent(rule.id)}`
          : `/automation/api/rules`;
        const method = rule ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: {
            "content-type": "application/json",
            "x-tenant-id": tenantId,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Failed to save (${res.status})`);
        }
        const saved = (await res.json()) as { data?: AutomationRule };
        setStatus("Saved.");
        if (!rule && saved.data?.id) {
          router.replace(`/automation/${saved.data.id}`);
        } else {
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }, [
    name,
    description,
    enabled,
    trigger,
    conditions,
    actions,
    rule,
    tenantId,
    router,
  ]);

  const remove = useCallback(async () => {
    if (!rule) return;
    if (!confirm(`Delete automation "${rule.name}"?`)) return;
    startTransition(async () => {
      try {
        const res = await fetch(
          `/automation/api/rules/${encodeURIComponent(rule.id)}`,
          {
            method: "DELETE",
            headers: { "x-tenant-id": tenantId },
          },
        );
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Failed to delete (${res.status})`);
        }
        router.replace("/automation");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }, [rule, tenantId, router]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Automation rule
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
            {rule ? rule.name : "New automation"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--z-muted)]">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4"
            />
            Enabled
          </label>
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="rounded-[var(--z-radius-md)] bg-[#00ff88] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#00e679] disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          {rule ? (
            <button
              type="button"
              onClick={remove}
              disabled={isPending}
              className="rounded-[var(--z-radius-md)] border border-[var(--z-danger)]/40 px-3 py-1.5 text-sm font-semibold text-[var(--z-danger)] hover:bg-[var(--z-danger)]/10 disabled:opacity-60"
            >
              Delete
            </button>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="rounded-[var(--z-radius-md)] border border-[var(--z-danger)]/40 bg-[var(--z-danger)]/10 px-3 py-2 text-xs text-[var(--z-danger)]">
          {error}
        </div>
      ) : null}
      {status ? (
        <div className="rounded-[var(--z-radius-md)] border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          {status}
        </div>
      ) : null}

      <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3">
        <div>
          <label className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Welcome new lead"
            className="mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
            Description
          </label>
          <textarea
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional description"
            className="mt-1 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2 text-sm text-[var(--z-fg)]"
          />
        </div>
      </section>

      <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <TriggerSelector value={trigger} onChange={setTrigger} disabled={isPending} />
      </section>

      <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <ConditionBuilder
          conditions={conditions}
          onChange={setConditions}
          disabled={isPending}
        />
      </section>

      <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
        <ActionBuilder
          actions={actions}
          onChange={setActions}
          disabled={isPending}
        />
      </section>
    </div>
  );
}

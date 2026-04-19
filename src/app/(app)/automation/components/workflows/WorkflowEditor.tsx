"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  AutomationActionDef,
  AutomationTriggerDef,
  AutomationWorkflow,
  AutomationWorkflowStatus,
} from "@/lib/automation/workflows/types";
import {
  ACTION_CATALOG,
  TRIGGER_CATALOG,
} from "@/lib/automation/workflows/types";
import { TriggerEditor } from "./TriggerEditor";
import { ActionEditor } from "./ActionEditor";
import { WorkflowRunHistory } from "./WorkflowRunHistory";

export type WorkflowEditorProps = {
  workflow?: AutomationWorkflow | null;
  mode: "create" | "edit";
};

function newActionId(): string {
  return `act_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function WorkflowEditor({ workflow, mode }: WorkflowEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(workflow?.name ?? "New workflow");
  const [description, setDescription] = useState(workflow?.description ?? "");
  const [status, setStatus] = useState<AutomationWorkflowStatus>(
    workflow?.status ?? "draft",
  );
  const [trigger, setTrigger] = useState<AutomationTriggerDef>(
    workflow?.trigger ?? { type: "custom.webhook" },
  );
  const [actions, setActions] = useState<AutomationActionDef[]>(
    workflow?.actions ?? [],
  );
  const [retryMax, setRetryMax] = useState<number>(workflow?.retry_max ?? 3);
  const [retryBackoffMs, setRetryBackoffMs] = useState<number>(
    workflow?.retry_backoff_ms ?? 1000,
  );
  const [concurrencyLimit, setConcurrencyLimit] = useState<string>(
    workflow?.concurrency_limit != null ? String(workflow.concurrency_limit) : "",
  );
  const [tags, setTags] = useState<string>(
    (workflow?.tags ?? []).join(", "),
  );
  const [isTriggerEditorOpen, setIsTriggerEditorOpen] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [isRunHistoryOpen, setIsRunHistoryOpen] = useState(false);
  const [draggingActionId, setDraggingActionId] = useState<string | null>(null);

  const triggerEntry = useMemo(
    () => TRIGGER_CATALOG.find((t) => t.type === trigger.type) ?? null,
    [trigger.type],
  );

  function addAction(type: string) {
    setActions((prev) => [
      ...prev,
      { id: newActionId(), type, config: {}, onError: "fail" },
    ]);
  }

  function updateAction(id: string, patch: Partial<AutomationActionDef>) {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    );
  }

  function moveAction(id: string, dir: -1 | 1) {
    setActions((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      if (idx === -1) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const tmp = next[idx]!;
      next[idx] = next[target]!;
      next[target] = tmp;
      return next;
    });
  }

  function removeAction(id: string) {
    setActions((prev) => prev.filter((a) => a.id !== id));
  }

  function reorderAction(sourceId: string, targetId: string) {
    if (sourceId === targetId) return;
    setActions((prev) => {
      const sourceIndex = prev.findIndex((item) => item.id === sourceId);
      const targetIndex = prev.findIndex((item) => item.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      if (!moved) return prev;
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  async function save() {
    setError(null);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      status,
      trigger,
      actions,
      retryMax,
      retryBackoffMs,
      concurrencyLimit: concurrencyLimit ? Number(concurrencyLimit) : null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const url =
      mode === "create"
        ? "/automation/api/workflows"
        : `/automation/api/workflows/${workflow?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    try {
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      const data = await res.json();
      const id = data?.data?.id ?? workflow?.id;
      if (id) {
        startTransition(() => {
          router.push(`/automation/workflows/${id}`);
          router.refresh();
        });
      } else {
        startTransition(() => {
          router.push("/automation/workflows");
          router.refresh();
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function destroy() {
    if (!workflow) return;
    if (!confirm("Delete this workflow? This cannot be undone.")) return;
    try {
      const res = await fetch(`/automation/api/workflows/${workflow.id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      startTransition(() => {
        router.push("/automation/workflows");
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function runNow() {
    if (!workflow) return;
    try {
      const res = await fetch(`/automation/api/workflows/${workflow.id}/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payload: {} }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? `HTTP ${res.status}`);
        return;
      }
      if (data?.data?.id) {
        router.push(`/automation/runs/${data.data.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            {mode === "create" ? "New workflow" : "Edit workflow"}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full bg-transparent text-xl sm:text-2xl font-semibold text-[var(--z-fg)] focus:outline-none border-b border-transparent focus:border-[var(--z-border)]"
            placeholder="Workflow name"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatus((prev) => (prev === "active" ? "paused" : "active"))}
            disabled={isPending}
            className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-sm text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-40"
            title="Enable/disable workflow"
          >
            {status === "active" ? "Disable" : "Enable"}
          </button>
          {workflow ? (
            <button
              onClick={() => setIsRunHistoryOpen(true)}
              className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-sm text-[var(--z-fg)] hover:bg-white/5"
            >
              Run history
            </button>
          ) : null}
          {workflow ? (
            <button
              onClick={runNow}
              disabled={isPending || status !== "active"}
              className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-3 py-1.5 text-sm text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-40"
              title={status !== "active" ? "Workflow must be active" : ""}
            >
              Run now
            </button>
          ) : null}
          {workflow ? (
            <button
              onClick={destroy}
              disabled={isPending}
              className="rounded-[var(--z-radius-md)] border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/20"
            >
              Delete
            </button>
          ) : null}
          <button
            onClick={save}
            disabled={isPending}
            className="rounded-[var(--z-radius-md)] bg-[#00ff88] px-4 py-1.5 text-sm font-semibold text-black hover:bg-[#00e679] disabled:opacity-40"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-[var(--z-radius-md)] border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <div className="text-xs uppercase tracking-wider text-[var(--z-muted)] mb-3 font-semibold">
              Description
            </div>
            <textarea
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)]"
              placeholder="What does this workflow do?"
            />
          </div>

          <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                Trigger
              </div>
              <button
                type="button"
                onClick={() => setIsTriggerEditorOpen(true)}
                className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-fg)] hover:bg-white/5"
              >
                Edit trigger
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={trigger.type}
                onChange={(e) =>
                  setTrigger((prev) => ({
                    ...prev,
                    type: e.target.value,
                    config: {},
                  }))
                }
                className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
              >
                {TRIGGER_CATALOG.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label}
                  </option>
                ))}
              </select>
              {triggerEntry?.description ? (
                <div className="text-xs text-[var(--z-muted)] self-center">
                  {triggerEntry.description}
                </div>
              ) : null}
            </div>

            <div className="mt-3 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] p-2 text-xs text-[var(--z-muted)]">
              {Object.keys(trigger.config ?? {}).length > 0 ? (
                <pre className="whitespace-pre-wrap break-all text-[11px]">
                  {JSON.stringify(trigger.config, null, 2)}
                </pre>
              ) : (
                "No trigger config set."
              )}
            </div>
          </div>

          <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                Actions ({actions.length})
              </div>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    addAction(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-1.5 text-xs text-[var(--z-fg)]"
              >
                <option value="">+ Add action</option>
                {ACTION_CATALOG.map((a) => (
                  <option key={a.type} value={a.type}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              {actions.length === 0 ? (
                <div className="text-xs text-[var(--z-muted)] italic">
                  No actions yet.
                </div>
              ) : null}
              {actions.map((action, i) => {
                const catalog = ACTION_CATALOG.find((c) => c.type === action.type);
                return (
                  <div
                    key={action.id}
                    draggable
                    onDragStart={() => setDraggingActionId(action.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (draggingActionId) reorderAction(draggingActionId, action.id);
                      setDraggingActionId(null);
                    }}
                    onDragEnd={() => setDraggingActionId(null)}
                    className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-[var(--z-muted)]">
                          #{i + 1}
                        </span>
                        <span className="text-sm font-medium text-[var(--z-fg)]">
                          {catalog?.label ?? action.type}
                        </span>
                        <span className="text-[10px] text-[var(--z-muted)] font-mono truncate">
                          {action.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveAction(action.id, -1)}
                          className="rounded px-2 py-0.5 text-xs text-[var(--z-muted)] hover:bg-white/5"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveAction(action.id, 1)}
                          className="rounded px-2 py-0.5 text-xs text-[var(--z-muted)] hover:bg-white/5"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => setEditingActionId(action.id)}
                          className="rounded px-2 py-0.5 text-xs text-[var(--z-fg)] hover:bg-white/5"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeAction(action.id)}
                          className="rounded px-2 py-0.5 text-xs text-rose-300 hover:bg-rose-500/15"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {catalog?.description ? (
                      <div className="text-[11px] text-[var(--z-muted)] mb-2">
                        {catalog.description}
                      </div>
                    ) : null}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]">
                        Label: {action.label?.trim() ? action.label : "—"}
                      </div>
                      <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]">
                        On error: {action.onError ?? "fail"}
                      </div>
                    </div>
                    <div className="mt-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-2 text-[11px] text-[var(--z-muted)]">
                      {Object.keys(action.config ?? {}).length > 0 ? (
                        <pre className="whitespace-pre-wrap break-all text-[11px]">
                          {JSON.stringify(action.config, null, 2)}
                        </pre>
                      ) : (
                        "No action config set."
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 space-y-3">
            <div className="text-xs uppercase tracking-wider text-[var(--z-muted)] font-semibold">
              Settings
            </div>
            <div>
              <label className="block text-[11px] text-[var(--z-muted)] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as AutomationWorkflowStatus)
                }
                className="w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[var(--z-muted)] mb-1">
                Retry max
              </label>
              <input
                type="number"
                value={retryMax}
                min={0}
                max={10}
                onChange={(e) => setRetryMax(Number(e.target.value))}
                className="w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--z-muted)] mb-1">
                Retry backoff (ms)
              </label>
              <input
                type="number"
                value={retryBackoffMs}
                min={0}
                onChange={(e) => setRetryBackoffMs(Number(e.target.value))}
                className="w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--z-muted)] mb-1">
                Concurrency limit (empty = no limit)
              </label>
              <input
                type="number"
                value={concurrencyLimit}
                min={0}
                onChange={(e) => setConcurrencyLimit(e.target.value)}
                className="w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--z-muted)] mb-1">
                Tags (comma separated)
              </label>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-sm text-[var(--z-fg)]"
              />
            </div>
          </div>
        </div>
      </section>
      <TriggerEditor
        open={isTriggerEditorOpen}
        trigger={trigger}
        onClose={() => setIsTriggerEditorOpen(false)}
        onSave={(next) => setTrigger(next)}
      />
      <ActionEditor
        open={Boolean(editingActionId)}
        action={actions.find((item) => item.id === editingActionId) ?? null}
        onClose={() => setEditingActionId(null)}
        onSave={(next) => updateAction(next.id, next)}
      />
      <WorkflowRunHistory
        open={isRunHistoryOpen}
        workflowId={workflow?.id ?? null}
        onClose={() => setIsRunHistoryOpen(false)}
      />
    </div>
  );
}

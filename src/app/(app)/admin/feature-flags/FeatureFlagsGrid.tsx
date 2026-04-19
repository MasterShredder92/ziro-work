"use client";

import { useState } from "react";
import type { FeatureFlag } from "@/lib/admin/adminTypes";
import { FeatureFlagToggle } from "../components/FeatureFlagToggle";

export type FeatureFlagsGridProps = {
  tenantId: string;
  initial: FeatureFlag[];
  canWrite: boolean;
};

export function FeatureFlagsGrid({
  tenantId,
  initial,
  canWrite,
}: FeatureFlagsGridProps) {
  const [flags, setFlags] = useState<FeatureFlag[]>(initial);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/feature-flags?tenantId=${encodeURIComponent(tenantId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            key: newKey,
            name: newName || newKey,
            enabled: false,
            rollout_percent: 100,
          }),
        },
      );
      const data = (await res.json().catch(() => null)) as {
        data?: FeatureFlag;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      if (data?.data) {
        setFlags((prev) => {
          const existing = prev.findIndex((f) => f.id === data.data!.id);
          if (existing >= 0) {
            const next = [...prev];
            next[existing] = data.data!;
            return next;
          }
          return [...prev, data.data!];
        });
      }
      setNewKey("");
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create flag");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canWrite ? (
        <div className="flex flex-wrap items-end gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
              Key
            </span>
            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="eg. ai.chat_streaming"
              className="h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 font-mono text-sm"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
              Name
            </span>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="AI chat streaming"
              className="h-9 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] px-3 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={create}
            disabled={creating || !newKey.trim()}
            className="h-9 rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-4 text-sm font-semibold text-black disabled:opacity-50"
          >
            {creating ? "Saving…" : "Add flag"}
          </button>
          {error ? (
            <div className="basis-full text-xs text-red-400">{error}</div>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {flags.map((flag) => (
          <FeatureFlagToggle
            key={flag.id}
            tenantId={tenantId}
            flag={flag}
            canWrite={canWrite}
            onUpdated={(next) =>
              setFlags((prev) =>
                prev.map((f) => (f.id === next.id ? next : f)),
              )
            }
          />
        ))}
        {flags.length === 0 ? (
          <div className="rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] p-6 text-center text-sm text-[var(--z-muted)]">
            No feature flags defined yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

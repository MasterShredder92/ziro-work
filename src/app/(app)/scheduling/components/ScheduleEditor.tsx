"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import type { Schedule } from "@/lib/scheduling/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type ScheduleEditorProps = {
  schedules: Schedule[];
  activeScheduleId: string | null;
  onCreateSchedule: (input: { name: string; color: string }) => void;
  onUpdateSchedule: (scheduleId: string, patch: { name?: string; color?: string }) => void;
};

export function ScheduleEditor({
  schedules,
  activeScheduleId,
  onCreateSchedule,
  onUpdateSchedule,
}: ScheduleEditorProps) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#22c55e");
  const active = schedules.find((schedule) => schedule.id === activeScheduleId) ?? null;
  const [editName, setEditName] = useState(active?.name ?? "");
  const [editColor, setEditColor] = useState(active?.color ?? "#22c55e");

  useEffect(() => {
    setEditName(active?.name ?? "");
    setEditColor(active?.color ?? "#22c55e");
  }, [active?.id, active?.name, active?.color]);

  return (
    <div className="space-y-3 rounded border border-[var(--z-border)] p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        Schedule editor
      </div>

      <div className="space-y-2">
        <div className="text-xs text-[var(--z-muted)]">Create schedule</div>
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Schedule name"
            className="min-w-0 flex-1"
          />
          <input
            type="color"
            value={newColor}
            onChange={(event) => setNewColor(event.target.value)}
            className="h-8 w-10 rounded border border-[var(--z-border)] bg-transparent p-1"
            aria-label="New schedule color"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              const name = newName.trim();
              if (!name) return;
              onCreateSchedule({ name, color: newColor });
              setNewName("");
              setNewColor("#22c55e");
            }}
          >
            Create
          </Button>
        </div>
      </div>

      {active ? (
        <div className="space-y-2">
          <div className="text-xs text-[var(--z-muted)]">Edit active schedule</div>
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              className="min-w-0 flex-1"
            />
            <input
              type="color"
              value={editColor}
              onChange={(event) => setEditColor(event.target.value)}
              className="h-8 w-10 rounded border border-[var(--z-border)] bg-transparent p-1"
              aria-label="Active schedule color"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                onUpdateSchedule(active.id, {
                  name: editName.trim() || active.name,
                  color: editColor,
                })
              }
            >
              Save schedule
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

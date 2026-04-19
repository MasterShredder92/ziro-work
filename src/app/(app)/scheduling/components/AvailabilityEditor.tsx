"use client";

import { useMemo, useState } from "react";
import type { AvailabilityBlock, Schedule } from "@/lib/scheduling/types";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/system/SurfaceStates";

type AvailabilityEditorProps = {
  open: boolean;
  schedule: Schedule | null;
  onClose: () => void;
  onCreateBlock: (
    scheduleId: string,
    input: { dayOfWeek: number; startTime: string; endTime: string },
  ) => void;
  onUpdateBlock: (
    blockId: string,
    patch: Partial<{ dayOfWeek: number; startTime: string; endTime: string }>,
  ) => void;
  onDeleteBlock: (blockId: string) => void;
};

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

type BlockDraft = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

function asInputTime(value: string): string {
  return value.slice(0, 5);
}

export function AvailabilityEditor({
  open,
  schedule,
  onClose,
  onCreateBlock,
  onUpdateBlock,
  onDeleteBlock,
}: AvailabilityEditorProps) {
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");
  const [drafts, setDrafts] = useState<Record<string, BlockDraft>>({});

  const blocks = useMemo(() => schedule?.availabilityBlocks ?? [], [schedule?.availabilityBlocks]);

  if (!open || !schedule) return null;

  const draftFor = (block: AvailabilityBlock): BlockDraft =>
    drafts[block.id] ?? {
      dayOfWeek: block.dayOfWeek,
      startTime: asInputTime(block.range.start),
      endTime: asInputTime(block.range.end),
    };

  return (
    <div className="fixed inset-0 z-[85] flex" role="presentation">
      <button
        type="button"
        aria-label="Close availability editor"
        className="flex-1 bg-black/40"
        onClick={onClose}
      />
      <aside className="h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-96">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
                Availability editor
              </div>
              <div className="text-sm font-semibold text-[var(--z-fg)]">{schedule.name}</div>
            </div>
            <button
              type="button"
              className="rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            <div className="space-y-2 rounded border border-[var(--z-border)] p-3">
              <div className="text-xs text-[var(--z-muted)]">Add block</div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={newDay}
                  onChange={(event) => setNewDay(Number(event.target.value))}
                  className="rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]"
                >
                  {DAY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={newStart}
                  onChange={(event) => setNewStart(event.target.value)}
                  className="rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]"
                />
                <input
                  type="time"
                  value={newEnd}
                  onChange={(event) => setNewEnd(event.target.value)}
                  className="rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onCreateBlock(schedule.id, {
                      dayOfWeek: newDay,
                      startTime: newStart,
                      endTime: newEnd,
                    })
                  }
                >
                  Add block
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {blocks.length === 0 ? (
                <EmptyState
                  title="No availability blocks"
                  description="Add a block to define when this schedule can accept bookings."
                />
              ) : null}
              {blocks.map((block) => {
                const draft = draftFor(block);
                return (
                  <div key={block.id} className="space-y-2 rounded border border-[var(--z-border)] p-3">
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={draft.dayOfWeek}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [block.id]: {
                              ...draft,
                              dayOfWeek: Number(event.target.value),
                            },
                          }))
                        }
                        className="rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]"
                      >
                        {DAY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={draft.startTime}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [block.id]: {
                              ...draft,
                              startTime: event.target.value,
                            },
                          }))
                        }
                        className="rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]"
                      />
                      <input
                        type="time"
                        value={draft.endTime}
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [block.id]: {
                              ...draft,
                              endTime: event.target.value,
                            },
                          }))
                        }
                        className="rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]"
                      />
                    </div>
                    <div className="flex justify-between">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteBlock(block.id)}
                      >
                        Delete
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          onUpdateBlock(block.id, {
                            dayOfWeek: draft.dayOfWeek,
                            startTime: draft.startTime,
                            endTime: draft.endTime,
                          })
                        }
                      >
                        Save block
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

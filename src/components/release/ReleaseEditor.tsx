"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { List } from "@/components/ui/List";

export type ReleaseEditorModel = {
  version: string;
  date: string;
  items: string[];
};

export type ReleaseEditorProps = {
  version: string;
  date: string;
  items: string[];
  onChange: (next: ReleaseEditorModel) => void;
};

export function ReleaseEditor({ version, date, items, onChange }: ReleaseEditorProps) {
  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange({ version, date, items: next });
  };

  const addItem = () => {
    onChange({ version, date, items: [...items, "New release note"] });
  };

  const removeItem = (index: number) => {
    onChange({ version, date, items: items.filter((_, i) => i !== index) });
  };

  const listItems = items.map((text, index) => ({
    id: `item-${index}`,
    titleLayout: "plain" as const,
    title: (
      <Input
        className="min-w-0"
        value={text}
        onChange={(e) => updateItem(index, e.target.value)}
        aria-label={`Release item ${index + 1}`}
      />
    ),
    action: (
      <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(index)}>
        Remove
      </Button>
    ),
  }));

  return (
    <Card padding="lg" radius="md" variant="elevated" className="space-y-[var(--z-space-5)] border-[var(--z-border)]">
      <div className="grid grid-cols-1 gap-[var(--z-space-4)] sm:grid-cols-2">
        <Input
          label="Version"
          value={version}
          onChange={(e) => onChange({ version: e.target.value, date, items })}
        />
        <Input
          label="Date"
          value={date}
          onChange={(e) => onChange({ version, date: e.target.value, items })}
          placeholder="Apr 17, 2026"
        />
      </div>
      <div className="space-y-[var(--z-space-3)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--z-muted)]">Highlights</span>
          <Button type="button" size="sm" variant="secondary" onClick={addItem}>
            Add item
          </Button>
        </div>
        {items.length ? <List items={listItems} /> : <p className="text-sm text-[var(--z-muted)]">No bullets yet.</p>}
      </div>
    </Card>
  );
}

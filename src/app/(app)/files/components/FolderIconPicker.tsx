"use client";

import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Bookmark,
  Bolt,
  Check,
  Flag,
  Folder,
  Heart,
  Star,
} from "lucide-react";

const ICON_TAGS = [
  "default",
  "star",
  "heart",
  "bookmark",
  "flag",
  "bolt",
  "check",
  "archive",
] as const;

export type FolderIconTag = (typeof ICON_TAGS)[number];

type FolderIconPreset = {
  tag: FolderIconTag;
  label: string;
  Icon: LucideIcon;
};

export const FOLDER_ICON_PRESETS: ReadonlyArray<FolderIconPreset> = [
  { tag: "default", label: "Default", Icon: Folder },
  { tag: "star", label: "Star", Icon: Star },
  { tag: "heart", label: "Heart", Icon: Heart },
  { tag: "bookmark", label: "Bookmark", Icon: Bookmark },
  { tag: "flag", label: "Flag", Icon: Flag },
  { tag: "bolt", label: "Bolt", Icon: Bolt },
  { tag: "check", label: "Check", Icon: Check },
  { tag: "archive", label: "Archive", Icon: Archive },
];

export function isFolderIconTag(value: unknown): value is FolderIconTag {
  return typeof value === "string" && ICON_TAGS.some((tag) => tag === value);
}

export function folderIconTooltip(icon: string | null): string {
  if (!icon || icon === "default") return "Icon: Default";
  const preset = FOLDER_ICON_PRESETS.find((entry) => entry.tag === icon);
  return preset ? `Icon: ${preset.label}` : "Icon: Default";
}

export function FolderIconGlyph({
  icon,
  className = "",
}: {
  icon: string | null;
  className?: string;
}) {
  const normalized = isFolderIconTag(icon) ? icon : "default";
  const preset = FOLDER_ICON_PRESETS.find((entry) => entry.tag === normalized);
  const Icon = preset?.Icon ?? Folder;
  return <Icon className={`h-4 w-4 shrink-0 ${className}`} aria-hidden />;
}

export interface FolderIconPickerProps {
  value: string | null;
  onChange: (icon: string | null) => void;
}

export function FolderIconPicker({ value, onChange }: FolderIconPickerProps) {
  const selected = isFolderIconTag(value) ? value : null;
  return (
    <div
      className="w-[208px] rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-2 shadow-lg"
      role="dialog"
      aria-label="Set folder icon"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        Set icon
      </div>
      <div className="grid grid-cols-4 gap-2">
        {FOLDER_ICON_PRESETS.map((entry) => {
          const isSelected = selected === entry.tag;
          return (
            <button
              key={entry.tag}
              type="button"
              title={`Icon: ${entry.label}`}
              aria-label={`Set ${entry.label} folder icon`}
              aria-pressed={isSelected}
              className={`inline-flex h-8 w-8 items-center justify-center rounded border text-[var(--z-fg)] transition-colors hover:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)] ${
                isSelected
                  ? "border-[var(--z-accent)] ring-1 ring-[var(--z-accent)]/35"
                  : "border-[var(--z-border)]"
              }`}
              onClick={() => onChange(entry.tag)}
            >
              <entry.Icon className="h-4 w-4" aria-hidden />
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="mt-2 w-full rounded border border-[var(--z-border)] px-2 py-1.5 text-left text-[11px] text-[var(--z-muted)] hover:bg-white/[0.06] hover:text-[var(--z-fg)]"
        onClick={() => onChange(null)}
      >
        Clear icon
      </button>
    </div>
  );
}

"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { List, type ListItem } from "@/components/ui/List";
import { OmniSearch } from "@/components/search/OmniSearch";
import { fuzzyScore } from "@/lib/search/fuzzy";
import { cn, focusRingClassName } from "@/components/ui/utils";
import type { CommandDef } from "@/components/command/commandPaletteTypes";
import { BASE_COMMANDS } from "@/components/command/commandPaletteConstants";
import {
  buildFamilyWorkspaceCommands,
  parseFamilyIdFromPath,
} from "@/lib/crm/familyWorkspaceCommands";

export type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  onNewFamily?: () => void;
  onNewStudent?: () => void;
  onNewInvoice?: () => void;
};

export function CommandPalette({
  open,
  onClose,
  tenantId: _tenantId,
  onNewFamily,
  onNewStudent,
  onNewInvoice,
}: CommandPaletteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = React.useState("search");
  const [commandQuery, setCommandQuery] = React.useState("");

  const familyIdOnPage = React.useMemo(() => parseFamilyIdFromPath(pathname), [pathname]);

  const commandCatalog = React.useMemo(() => {
    if (!familyIdOnPage) return BASE_COMMANDS;
    return [...buildFamilyWorkspaceCommands(familyIdOnPage), ...BASE_COMMANDS];
  }, [familyIdOnPage]);

  React.useEffect(() => {
    if (!open) {
      setTab("search");
      setCommandQuery("");
    }
  }, [open]);

  const filteredCommands = React.useMemo(() => {
    const q = commandQuery.trim();
    if (!q.length) return commandCatalog;
    return commandCatalog.filter(
      (c) => Math.max(fuzzyScore(q, c.label), fuzzyScore(q, c.haystack)) > 0.25
    );
  }, [commandCatalog, commandQuery]);

  const runCommand = React.useCallback(
    (c: CommandDef) => {
      if (c.kind === "nav") {
        router.push(c.href);
        onClose();
        return;
      }
      if (c.actionId === "familyAddStudent") {
        if (familyIdOnPage) {
          router.push(`/crm/families/${familyIdOnPage}?tab=overview&addStudent=1`);
        }
        onClose();
        return;
      }
      const map = {
        newFamily: onNewFamily,
        newStudent: onNewStudent,
        newInvoice: onNewInvoice,
      } as const;
      map[c.actionId]?.();
      onClose();
    },
    [onClose, onNewFamily, onNewInvoice, onNewStudent, router, familyIdOnPage]
  );

  const commandItems: ListItem[] = React.useMemo(
    () =>
      filteredCommands.map((c) => ({
        id: c.id,
        title: c.label,
        description:
          c.kind === "nav"
            ? c.href
            : c.actionId === "familyAddStudent"
              ? "Opens Overview and add-student flow"
              : "Workspace action",
        onPress: () => runCommand(c),
      })),
    [filteredCommands, runCommand]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Command center"
      panelClassName="max-w-2xl"
    >
      <div className="space-y-[var(--z-space-4)]">
        <Tabs
          tabs={[
            { id: "search", label: "Search" },
            { id: "commands", label: "Commands" },
          ]}
          activeTab={tab}
          onChange={setTab}
        />

        {tab === "search" ? (
          <OmniSearch onClose={onClose} />
        ) : (
          <div>
            <input
              type="search"
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
              placeholder="Filter commands…"
              className={cn(
                "w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)]",
                "px-[var(--z-space-4)] py-[var(--z-space-3)] text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)]",
                "focus-visible:border-[color-mix(in_oklab,var(--z-accent),transparent_35%)]",
                "focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--z-accent),transparent_78%)]",
                focusRingClassName()
              )}
            />
            {familyIdOnPage && !commandQuery.trim() && (
              <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--z-muted)]">
                This family — quick jumps and add student appear first
              </p>
            )}
            {commandItems.length === 0 ? (
              <p className="mt-[var(--z-space-4)] text-xs text-[var(--z-muted)]">No commands match.</p>
            ) : (
              <div className="mt-[var(--z-space-4)] max-h-[min(48vh,360px)] overflow-y-auto pr-1">
                <List items={commandItems} itemClassName="neon-ramp" />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

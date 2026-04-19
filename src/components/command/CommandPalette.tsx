"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";
import { List, type ListItem } from "@/components/ui/List";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { fuzzyScore } from "@/lib/search/fuzzy";
import { cn, focusRingClassName } from "@/components/ui/utils";

type CommandNav = {
  id: string;
  label: string;
  kind: "nav";
  href: string;
  haystack: string;
};

type CommandAction = {
  id: string;
  label: string;
  kind: "action";
  actionId: "newFamily" | "newStudent" | "newInvoice";
  haystack: string;
};

type CommandDef = CommandNav | CommandAction;

const COMMANDS: CommandDef[] = [
  {
    id: "nav-dashboard",
    label: "Go to Dashboard",
    kind: "nav",
    href: "/dashboard",
    haystack: "dashboard home overview",
  },
  {
    id: "nav-studio-map",
    label: "Go to Studio Map",
    kind: "nav",
    href: "/studio-map",
    haystack: "studio map locations rooms",
  },
  {
    id: "act-family",
    label: "New Family",
    kind: "action",
    actionId: "newFamily",
    haystack: "new family account household",
  },
  {
    id: "act-student",
    label: "New Student",
    kind: "action",
    actionId: "newStudent",
    haystack: "new student learner enroll",
  },
  {
    id: "act-invoice",
    label: "New Invoice",
    kind: "action",
    actionId: "newInvoice",
    haystack: "new invoice billing charge",
  },
  {
    id: "nav-leads",
    label: "Review Leads",
    kind: "nav",
    href: "/lifecycle/lead-work",
    haystack: "leads pipeline intake prospects",
  },
  {
    id: "nav-at-risk",
    label: "See At-Risk Students",
    kind: "nav",
    href: "/lifecycle/retention",
    haystack: "at risk retention churn students",
  },
];

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
  tenantId,
  onNewFamily,
  onNewStudent,
  onNewInvoice,
}: CommandPaletteProps) {
  const router = useRouter();
  const [tab, setTab] = React.useState("search");
  const [commandQuery, setCommandQuery] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setTab("search");
      setCommandQuery("");
    }
  }, [open]);

  const filteredCommands = React.useMemo(() => {
    const q = commandQuery.trim();
    if (!q.length) return COMMANDS;
    return COMMANDS.filter((c) => Math.max(fuzzyScore(q, c.label), fuzzyScore(q, c.haystack)) > 0.25);
  }, [commandQuery]);

  const runCommand = React.useCallback(
    (c: CommandDef) => {
      if (c.kind === "nav") {
        router.push(c.href);
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
    [onClose, onNewFamily, onNewInvoice, onNewStudent, router]
  );

  const commandItems: ListItem[] = React.useMemo(
    () =>
      filteredCommands.map((c) => ({
        id: c.id,
        title: c.label,
        description: c.kind === "nav" ? c.href : "Workspace action",
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
          <GlobalSearch tenantId={tenantId} onClose={onClose} />
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

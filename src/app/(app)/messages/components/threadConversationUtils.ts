import type { Message } from "@/lib/messaging/types";

export type DayBucket = {
  dayKey: string;
  label: string;
  messages: Message[];
};

export function dayKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "invalid";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDayDividerLabel(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };
  if (d.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString(undefined, opts);
}

export function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function groupMessagesByDay(messages: Message[]): DayBucket[] {
  const sorted = [...messages].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const out: DayBucket[] = [];
  for (const m of sorted) {
    const dayKey = dayKeyFromIso(m.createdAt);
    const label = formatDayDividerLabel(m.createdAt);
    const prev = out[out.length - 1];
    if (!prev || prev.dayKey !== dayKey) {
      out.push({ dayKey, label, messages: [m] });
    } else {
      prev.messages.push(m);
    }
  }
  return out;
}

/** Heuristic for optional centered system lines (no bubble). */
export function isLikelySystemMessage(m: Message): boolean {
  const t = m.body.trim();
  if (!t) return false;
  if (/^system\b/i.test(m.senderName ?? "")) return true;
  return (
    /^You started this conversation\.?$/i.test(t) ||
    /^This conversation was (created|started)\.?$/i.test(t)
  );
}

/**
 * Split a chronological day list into runs of the same sender.
 * System messages always break into their own single-message run.
 */
export function splitIntoSenderRuns(dayMessages: Message[]): Message[][] {
  const runs: Message[][] = [];
  let current: Message[] = [];

  const flush = () => {
    if (current.length) {
      runs.push(current);
      current = [];
    }
  };

  for (const m of dayMessages) {
    if (isLikelySystemMessage(m)) {
      flush();
      runs.push([m]);
      continue;
    }
    const head = current[0];
    const prev = current[current.length - 1];
    const prevTs = prev ? new Date(prev.createdAt).getTime() : 0;
    const nextTs = new Date(m.createdAt).getTime();
    const breaksByGap =
      Number.isFinite(prevTs) &&
      Number.isFinite(nextTs) &&
      Math.abs(nextTs - prevTs) > 10 * 60_000;
    if (!head || head.senderId !== m.senderId || breaksByGap) {
      flush();
      current = [m];
    } else {
      current.push(m);
    }
  }
  flush();
  return runs;
}

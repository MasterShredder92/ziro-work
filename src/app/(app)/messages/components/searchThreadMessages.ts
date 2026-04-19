import type { Message } from "@/lib/messaging/types";
import type { DayBucket } from "./threadConversationUtils";
import { splitIntoSenderRuns } from "./threadConversationUtils";

export type ThreadSearchMatch = {
  messageId: string;
  dayIndex: number;
  runIndex: number;
};

export type HighlightSegment = { hit: boolean; text: string };

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildPlainSearchText(message: Message): string {
  const htmlPart = message.bodyHtml?.trim() ? stripHtml(message.bodyHtml) : "";
  return [message.body, htmlPart].filter(Boolean).join("\n\n");
}

export function messageMatchesQuery(
  message: Message,
  senderLabel: string,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return false;
  const hay = [
    message.body,
    message.bodyHtml ? stripHtml(message.bodyHtml) : "",
    senderLabel,
    message.channelType,
    message.subject ?? "",
    ...message.attachments.map((a) => a.name),
  ]
    .join("\n")
    .toLowerCase();
  return hay.includes(needle);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive substring splits for inline highlight spans. */
export function splitWithHighlights(
  text: string,
  query: string,
): HighlightSegment[] {
  const q = query.trim();
  if (!q) return [{ hit: false, text }];
  const re = new RegExp(escapeRegExp(q), "gi");
  const out: HighlightSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (!m[0]) break;
    if (m.index > last) out.push({ hit: false, text: text.slice(last, m.index) });
    out.push({ hit: true, text: m[0] });
    last = m.index + m[0].length;
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  if (last < text.length) out.push({ hit: false, text: text.slice(last) });
  return out;
}

export function collectSearchMatches(
  days: DayBucket[],
  senderLabelFor: (m: Message) => string,
  query: string,
): ThreadSearchMatch[] {
  const q = query.trim();
  if (!q) return [];
  const out: ThreadSearchMatch[] = [];
  days.forEach((day, dayIndex) => {
    const runs = splitIntoSenderRuns(day.messages);
    runs.forEach((run, runIndex) => {
      for (const msg of run) {
        if (messageMatchesQuery(msg, senderLabelFor(msg), q)) {
          out.push({ messageId: msg.id, dayIndex: dayIndex, runIndex: runIndex });
        }
      }
    });
  });
  return out;
}

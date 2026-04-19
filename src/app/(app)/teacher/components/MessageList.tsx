import type { AIConversation } from "@/lib/types/entities";
import { PortalMessageList } from "@/components/portals/PortalMessageList";

interface MessageListProps {
  messages: AIConversation[];
  title?: string;
  maxRows?: number;
}

function conversationTitle(c: AIConversation): string {
  const meta = (c["metadata"] as Record<string, unknown> | null | undefined) ?? {};
  const t = (meta["title"] as string | undefined) ?? "";
  if (t.trim()) return t;
  const source = (c["source"] as string | undefined) ?? "chat";
  const route = (c["client_route"] as string | undefined) ?? "";
  return route ? `${source} · ${route}` : source;
}

function conversationPreview(c: AIConversation): string {
  const meta = (c["metadata"] as Record<string, unknown> | null | undefined) ?? {};
  const preview =
    (meta["last_message"] as string | undefined) ??
    (meta["preview"] as string | undefined) ??
    "";
  return preview.trim();
}

export function MessageList({
  messages,
  title = "Messages",
  maxRows = 10,
}: MessageListProps) {
  return (
    <PortalMessageList
      title={title}
      maxRows={maxRows}
      rows={messages.map((c) => ({
        id: c.id,
        title: conversationTitle(c),
        preview: conversationPreview(c) || null,
        updatedAt: c.updated_at ?? c.created_at,
      }))}
    />
  );
}

import type { StudentMessageItem } from "@/lib/student/types";
import { PortalMessageList } from "@/components/portals/PortalMessageList";

export interface MessageListProps {
  messages: StudentMessageItem[];
  emptyLabel?: string;
  maxRows?: number;
}

export function MessageList({
  messages,
  emptyLabel = "No messages yet.",
  maxRows,
}: MessageListProps) {
  return (
    <PortalMessageList
      title="Messages"
      maxRows={maxRows}
      emptyLabel={emptyLabel}
      rows={messages.map((m) => ({
        id: m.id,
        title: m.title,
        preview: m.preview ?? null,
        subtitle: m.source ?? null,
        updatedAt: m.updated_at,
      }))}
    />
  );
}

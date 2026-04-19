import type { FamilyMessageItem } from "@/lib/family/types";
import { PortalMessageList } from "@/components/portals/PortalMessageList";

interface MessageListProps {
  messages: FamilyMessageItem[];
  title?: string;
  maxRows?: number;
}

export function MessageList({ messages, title = "Messages", maxRows = 10 }: MessageListProps) {
  return (
    <PortalMessageList
      title={title}
      maxRows={maxRows}
      rows={messages.map((m) => ({
        id: m.id,
        title: m.title,
        preview: m.preview ?? null,
        updatedAt: m.updated_at ?? m.created_at,
      }))}
    />
  );
}

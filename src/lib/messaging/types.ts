export type MessagingParticipant = {
  profileId: string;
  fullName: string;
  role: string | null;
  avatarUrl: string | null;
};

export type InboxThread = {
  id: string;
  tenantId: string;
  participantIds: string[];
  counterpart: MessagingParticipant | null;
  subject: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
};

export type InboxMessage = {
  id: string;
  threadId: string;
  authorProfileId: string;
  authorName: string | null;
  role: string;
  body: string;
  createdAt: string;
  seq: number;
  isMine: boolean;
};

export type InboxSummary = {
  profileId: string;
  tenantId: string;
  threads: InboxThread[];
  totalThreads: number;
  totalUnread: number;
};

export type ConversationDetail = {
  thread: InboxThread;
  messages: InboxMessage[];
  participants: MessagingParticipant[];
};

export const MESSAGING_SOURCE = "messaging" as const;

// =============================================================================
// Messaging OS (first-class) types.
// These are the canonical types used by the top-level /api/messages/* routes,
// the MessagingDashboard, and the delivery + notification engines.
// The Inbox* types above continue to power the legacy aiConversations-backed
// inbox until every surface is migrated.
// =============================================================================

export type ChannelType = "email" | "sms" | "in_app" | "push";

export type ThreadStatus = "open" | "archived" | "snoozed";

export type DeliveryStatus =
  | "draft"
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "bounced";

export type ParticipantRole = "owner" | "member" | "cc" | "bcc" | "observer";

export type MessageParticipant = {
  id: string;
  threadId: string;
  profileId: string;
  role: ParticipantRole;
  isMuted: boolean;
  lastReadAt: string | null;
  joinedAt: string;
  display: MessagingParticipant | null;
};

export type MessageAttachment = {
  id: string;
  name: string;
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
};

export type MessageChannel = {
  id: string;
  tenantId: string;
  channelType: ChannelType;
  label: string;
  isActive: boolean;
  isDefault: boolean;
  config: Record<string, unknown> | null;
};

export type MessageThread = {
  id: string;
  tenantId: string;
  subject: string | null;
  channelType: ChannelType;
  status: ThreadStatus;
  participantIds: string[];
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  contextType: string | null;
  contextId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  participants: MessagingParticipant[];
};

export type MessageDelivery = {
  id: string;
  messageId: string;
  threadId: string;
  recipientId: string;
  channelType: ChannelType;
  status: DeliveryStatus;
  attempts: number;
  errorMessage: string | null;
  queuedAt: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
};

export type Message = {
  id: string;
  tenantId: string;
  threadId: string;
  senderId: string;
  senderName: string | null;
  recipientIds: string[];
  channelType: ChannelType;
  subject: string | null;
  body: string;
  bodyHtml: string | null;
  templateId: string | null;
  mergeVars: Record<string, unknown> | null;
  attachments: MessageAttachment[];
  deliveryStatus: DeliveryStatus;
  deliveries: MessageDelivery[];
  replyToMessageId: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ThreadFilter = {
  status?: ThreadStatus;
  channelType?: ChannelType;
  participantId?: string;
  contextType?: string;
  contextId?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type ThreadListResult = {
  threads: MessageThread[];
  totalUnread: number;
};

export type ThreadDetail = {
  thread: MessageThread;
  messages: Message[];
  participants: MessageParticipant[];
  channels: MessageChannel[];
};

export type UnreadSummary = {
  profileId: string;
  tenantId: string;
  totalUnread: number;
  threads: Array<{
    threadId: string;
    unreadCount: number;
    lastMessageAt: string | null;
    subject: string | null;
    channelType: ChannelType;
  }>;
};

export type SearchHit = {
  message: Message;
  thread: MessageThread;
  snippet: string;
};

export type SendMessageInput = {
  threadId?: string | null;
  subject?: string | null;
  body: string;
  bodyHtml?: string | null;
  channelType?: ChannelType;
  recipientIds?: string[];
  templateId?: string | null;
  mergeVars?: Record<string, unknown> | null;
  attachments?: MessageAttachment[];
  contextType?: string | null;
  contextId?: string | null;
  replyToMessageId?: string | null;
};

export type CreateThreadInput = {
  subject?: string | null;
  channelType?: ChannelType;
  participantIds: string[];
  contextType?: string | null;
  contextId?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type NotificationBadge = {
  profileId: string;
  totalUnread: number;
  mentions: number;
  alerts: number;
};


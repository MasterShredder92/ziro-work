import type {
  ChannelType,
  MessageParticipant,
  ParticipantRole,
} from "@/lib/messaging/types";

export type ThreadParticipantChannel = "email" | "sms" | "internal";

export type ThreadParticipantRoleBadge =
  | "student"
  | "family"
  | "teacher"
  | "staff"
  | "system";

export type DerivedThreadParticipant = {
  id: string;
  profileId: string;
  name: string;
  roleBadge: ThreadParticipantRoleBadge;
  /** Thread membership role (owner, member, …). */
  threadRole: ParticipantRole;
  threadRoleLabel: string;
  /** Raw profile role from directory (e.g. teacher, director). */
  profileRole: string | null;
  channel: ThreadParticipantChannel;
  email?: string;
  phone?: string;
  relationships: string[];
  initials: string;
  avatarUrl: string | null;
  memberRoleBadge: "Owner" | "Admin" | "Member";
  lastActiveAt: string | null;
  activeNow: boolean;
  presenceTooltip: string;
};

export function mapThreadChannel(ct: ChannelType): ThreadParticipantChannel {
  if (ct === "email") return "email";
  if (ct === "sms") return "sms";
  return "internal";
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const w = parts[0]!;
    return w.length === 1 ? w.toUpperCase() : w.slice(0, 2).toUpperCase();
  }
  const a = parts[0]![0] ?? "";
  const b = parts[parts.length - 1]![0] ?? "";
  return `${a}${b}`.toUpperCase();
}

function firstToken(name: string): string {
  const t = name.trim().split(/\s+/)[0];
  return t && t.length > 0 ? t : name.trim() || "Member";
}

function mapRoleBadge(
  displayRole: string | null,
  displayName: string,
): ThreadParticipantRoleBadge {
  const n = (displayRole ?? "").toLowerCase();
  const nm = displayName.toLowerCase();
  if (nm === "system" || nm.startsWith("system ")) return "system";
  if (n.includes("student")) return "student";
  if (
    n.includes("parent") ||
    n.includes("guardian") ||
    n.includes("family") ||
    n.includes("mother") ||
    n.includes("father")
  ) {
    return "family";
  }
  if (n.includes("teacher") || n.includes("instructor")) return "teacher";
  return "staff";
}

function formatThreadRole(role: ParticipantRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "member":
      return "Member";
    case "cc":
      return "CC";
    case "bcc":
      return "BCC";
    case "observer":
      return "Observer";
    default:
      return role;
  }
}

function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "just now";
  const deltaMs = Date.now() - t;
  const absMs = Math.abs(deltaMs);
  const suffix = deltaMs >= 0 ? "ago" : "from now";
  if (absMs < 60_000) return "just now";
  if (absMs < 3_600_000) return `${Math.round(absMs / 60_000)}m ${suffix}`;
  if (absMs < 86_400_000) return `${Math.round(absMs / 3_600_000)}h ${suffix}`;
  return `${Math.round(absMs / 86_400_000)}d ${suffix}`;
}

function readLastActiveAt(p: MessageParticipant): string | null {
  const ext = p as MessageParticipant & {
    lastActiveAt?: string | null;
    display?: (NonNullable<MessageParticipant["display"]> & {
      lastActiveAt?: string | null;
    }) | null;
  };
  const raw = ext.lastActiveAt ?? ext.display?.lastActiveAt ?? p.lastReadAt ?? p.joinedAt ?? null;
  return typeof raw === "string" && raw.trim() ? raw : null;
}

function isActiveNow(lastActiveAt: string | null): boolean {
  if (!lastActiveAt) return false;
  const t = new Date(lastActiveAt).getTime();
  if (!Number.isFinite(t)) return false;
  return Math.abs(Date.now() - t) <= 5 * 60_000;
}

function memberRoleBadge(participant: MessageParticipant, profileRole: string | null): "Owner" | "Admin" | "Member" {
  if (participant.role === "owner") return "Owner";
  const role = (profileRole ?? "").toLowerCase();
  if (
    role.includes("admin") ||
    role.includes("director") ||
    role.includes("staff")
  ) {
    return "Admin";
  }
  return "Member";
}

function buildRelationships(
  p: MessageParticipant,
  contextType: string | null,
  threadSubject: string | null,
): string[] {
  const lines: string[] = [];
  if (p.role === "owner") lines.push("Conversation owner");
  else if (p.role === "observer") lines.push("Read-only observer");
  else if (p.role === "cc") lines.push("Copied on thread");
  else if (p.role === "bcc") lines.push("Blind-copied on thread");

  if (contextType?.trim()) {
    const sub = threadSubject?.trim();
    lines.push(
      sub
        ? `Context (${contextType}): ${sub}`
        : `Linked context: ${contextType}`,
    );
  }
  return lines;
}

export function deriveThreadParticipants(
  participants: MessageParticipant[],
  threadChannel: ChannelType,
  contextType: string | null,
  threadSubject: string | null,
): DerivedThreadParticipant[] {
  const channel = mapThreadChannel(threadChannel);
  return participants.map((p) => {
    const name =
      (p.display?.fullName ?? "").trim() || p.profileId.slice(0, 8);
    const lastActiveAt = readLastActiveAt(p);
    const activeNow = isActiveNow(lastActiveAt);
    const profileRole = p.display?.role ?? null;
    const memberBadge = memberRoleBadge(p, profileRole);
    return {
      id: p.id,
      profileId: p.profileId,
      name,
      roleBadge: mapRoleBadge(p.display?.role ?? null, name),
      threadRole: p.role,
      threadRoleLabel: formatThreadRole(p.role),
      profileRole,
      channel,
      relationships: buildRelationships(p, contextType, threadSubject),
      initials: initialsFromName(name),
      avatarUrl: p.display?.avatarUrl ?? null,
      memberRoleBadge: memberBadge,
      lastActiveAt,
      activeNow,
      presenceTooltip: activeNow
        ? "Active now"
        : `Last seen ${lastActiveAt ? formatRelativeTime(lastActiveAt) : "unknown"}`,
    };
  });
}

export function collapsedNamePreview(
  rows: DerivedThreadParticipant[],
  limit = 6,
): string {
  return rows
    .slice(0, limit)
    .map((r) => firstToken(r.name))
    .join(", ");
}

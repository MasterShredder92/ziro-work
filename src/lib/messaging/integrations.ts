import "server-only";
import { getTemplate } from "@data/templates";
import type { MessageAttachment } from "./types";

/**
 * Template rendering — integrates with the Templates OS. Falls back to a simple
 * {{var}} substitution when the template engine isn't available at runtime.
 */
export type RenderedTemplate = {
  subject: string | null;
  body: string;
  bodyHtml: string | null;
  templateId: string;
};

function substitute(
  input: string,
  vars: Record<string, unknown>,
): string {
  return input.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    const parts = String(key).split(".");
    let value: unknown = vars;
    for (const p of parts) {
      if (value && typeof value === "object" && p in (value as object)) {
        value = (value as Record<string, unknown>)[p];
      } else {
        value = undefined;
        break;
      }
    }
    return value === null || value === undefined ? "" : String(value);
  });
}

export async function renderTemplate(
  tenantId: string,
  templateId: string,
  vars: Record<string, unknown>,
): Promise<RenderedTemplate | null> {
  try {
    const tpl = await getTemplate(templateId, tenantId);
    if (!tpl) return null;
    const template = tpl as Record<string, unknown>;
    const subject =
      typeof template.subject === "string"
        ? substitute(template.subject, vars)
        : null;
    const body =
      typeof template.body === "string" ? substitute(template.body, vars) : "";
    const bodyHtml =
      typeof template.body_html === "string"
        ? substitute(template.body_html, vars)
        : null;
    return { subject, body, bodyHtml, templateId };
  } catch {
    return null;
  }
}

/**
 * CRM contact resolution — looks up a profile / student / lead by id. Returns
 * canonicalized contact info the messaging layer can use.
 */
export type ResolvedContact = {
  profileId: string | null;
  email: string | null;
  phone: string | null;
  displayName: string;
  source: "profile" | "student" | "lead" | "unknown";
};

export async function resolveContact(
  tenantId: string,
  contactId: string,
): Promise<ResolvedContact> {
  if (!contactId) {
    return {
      profileId: null,
      email: null,
      phone: null,
      displayName: "Unknown",
      source: "unknown",
    };
  }

  try {
    const { getProfileById } = await import("@data/profiles");
    const profile = await getProfileById(contactId, tenantId);
    if (profile) {
      const display =
        `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
        profile.email ||
        profile.id;
      return {
        profileId: profile.id,
        email: profile.email ?? null,
        phone: (profile.phone as string | null) ?? null,
        displayName: display,
        source: "profile",
      };
    }
  } catch {
    /* noop - profile table may be missing */
  }
  try {
    const { getStudentById } = await import("@data/students");
    const student = await getStudentById(contactId, tenantId);
    if (student) {
      const s = student as Record<string, unknown>;
      const display =
        `${(s.first_name as string) ?? ""} ${(s.last_name as string) ?? ""}`.trim() ||
        (s.email as string | undefined) ||
        contactId;
      return {
        profileId: null,
        email: (s.email as string | null) ?? null,
        phone: (s.phone as string | null) ?? null,
        displayName: display,
        source: "student",
      };
    }
  } catch {
    /* noop */
  }
  try {
    const { getLeadById } = await import("@data/leads");
    const lead = await getLeadById(contactId, tenantId);
    if (lead) {
      const l = lead as Record<string, unknown>;
      const display =
        `${(l.first_name as string) ?? ""} ${(l.last_name as string) ?? ""}`.trim() ||
        (l.email as string | undefined) ||
        contactId;
      return {
        profileId: null,
        email: (l.email as string | null) ?? null,
        phone: (l.phone as string | null) ?? null,
        displayName: display,
        source: "lead",
      };
    }
  } catch {
    /* noop */
  }

  return {
    profileId: null,
    email: null,
    phone: null,
    displayName: contactId,
    source: "unknown",
  };
}

/**
 * Scheduling OS hook — queue a reminder triggered by a message. The Scheduling
 * OS polls its own queue; we write a hint into the session log so it can be
 * picked up by the scheduler's worker.
 */
export async function scheduleReminder(input: {
  tenantId: string;
  messageId: string;
  threadId: string;
  runAt: string;
  note: string;
}): Promise<void> {
  try {
    const { logAuditWithContext } = await import("@/lib/audit/log");
    await logAuditWithContext(
      "messaging.reminder_scheduled",
      { tenantId: input.tenantId },
      {
        message_id: input.messageId,
        thread_id: input.threadId,
        run_at: input.runAt,
        note: input.note,
      },
    );
  } catch {
    /* noop */
  }
}

/**
 * Automation trigger — no-op until automation engine is rebuilt.
 */
export async function emitAutomationTrigger(
  _tenantId: string,
  _event: string,
  _payload: Record<string, unknown>,
): Promise<void> {
  // automation removed — no-op
}

export type AttachmentInput = MessageAttachment;

"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { resolveMessagingEmailIdentity } from "@/lib/branding/messagingIntegration";
import { renderTemplate } from "@/lib/messaging/integrations";

export type SendTestMessageInput = {
  body: string;
  subject?: string | null;
  templateId?: string | null;
  mergeVars?: Record<string, unknown> | null;
};

const MAX_BODY = 120_000;

async function getAuthUserEmail(): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const cookieStore = await cookies();
  const client = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          return;
        }
      },
    },
  });
  const {
    data: { session },
    error,
  } = await client.auth.getSession();
  if (error || !session?.user?.email) return null;
  return session.user.email.trim() || null;
}

/**
 * Sends a one-off test email to the signed-in user's auth email.
 * Does not create threads, messages, or delivery rows.
 */
export async function sendTestMessage(
  input: SendTestMessageInput,
): Promise<{ ok: true } | { ok: false }> {
  try {
    const session = await requirePermission("messages.write")();
    await assertTenantAccess(session.tenantId);

    const to = await getAuthUserEmail();
    if (!to) return { ok: false };

    let body = (input.body ?? "").trim();
    if (body.length > MAX_BODY) return { ok: false };

    let subject = (input.subject ?? "").trim() || null;

    if (input.templateId) {
      const rendered = await renderTemplate(
        session.tenantId,
        input.templateId,
        (input.mergeVars ?? {}) as Record<string, unknown>,
      );
      if (rendered) {
        if (!subject && rendered.subject?.trim()) subject = rendered.subject.trim();
        if (!body && rendered.body.trim()) body = rendered.body.trim();
      }
    }

    if (!body) return { ok: false };

    const apiKey =
      process.env.RESEND_API_KEY?.trim() ||
      process.env.MESSAGING_RESEND_API_KEY?.trim();
    if (!apiKey) return { ok: false };

    const identity = await resolveMessagingEmailIdentity(session.tenantId);
    const fromHeader = `${identity.fromName} <${identity.fromEmail}>`;
    const subjectLine =
      subject?.length ? subject : "[ZiroWork] Messaging test";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: fromHeader,
        to: [to],
        reply_to: identity.replyTo ?? undefined,
        subject: `[Test] ${subjectLine}`,
        text: body,
      }),
    });

    if (!res.ok) return { ok: false };
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

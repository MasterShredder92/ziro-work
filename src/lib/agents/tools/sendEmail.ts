/**
 * sendEmail — Agent tool for sending transactional emails via Resend.
 * Used by Star (lead welcome), Stewie (retention outreach), and other agents.
 */

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey =
    process.env.RESEND_API_KEY?.trim() ||
    process.env.MESSAGING_RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.error("[sendEmail] No Resend API key configured (RESEND_API_KEY)");
    return { success: false, error: "No email API key configured" };
  }

  const fromName = input.fromName ?? "ZiroWork";
  const fromEmail = input.fromEmail ?? (process.env.RESEND_FROM_EMAIL ?? "noreply@zirowork.com");
  const fromHeader = `${fromName} <${fromEmail}>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: fromHeader,
        to: [input.to],
        reply_to: input.replyTo ?? undefined,
        subject: input.subject,
        text: input.body,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown");
      console.error(`[sendEmail] Resend error ${res.status}: ${errText}`);
      return { success: false, error: `Resend ${res.status}: ${errText}` };
    }

    const json = await res.json().catch(() => ({})) as { id?: string };
    return { success: true, messageId: json.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sendEmail] Unexpected error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Anthropic tool definition for use in the agent tool loop.
 */
export const sendEmailToolDefinition = {
  name: "send_email",
  description:
    "Send a transactional email to a lead, student, or family member. Use this to send welcome emails, follow-ups, billing notices, or any outreach.",
  input_schema: {
    type: "object" as const,
    properties: {
      to: {
        type: "string",
        description: "Recipient email address",
      },
      subject: {
        type: "string",
        description: "Email subject line",
      },
      body: {
        type: "string",
        description: "Plain text email body",
      },
      fromName: {
        type: "string",
        description: "Sender display name (optional, defaults to studio name)",
      },
    },
    required: ["to", "subject", "body"],
  },
};

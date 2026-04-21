/**
 * sendEmail — Agent tool for sending transactional emails via Resend.
 * Used by Star (lead welcome), Stewie (retention outreach), and other agents.
 */
export async function sendEmail(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    const apiKey = ((_a = process.env.RESEND_API_KEY) === null || _a === void 0 ? void 0 : _a.trim()) ||
        ((_b = process.env.MESSAGING_RESEND_API_KEY) === null || _b === void 0 ? void 0 : _b.trim());
    if (!apiKey) {
        console.error("[sendEmail] No Resend API key configured (RESEND_API_KEY)");
        return { success: false, error: "No email API key configured" };
    }
    const fromName = (_c = input.fromName) !== null && _c !== void 0 ? _c : "ZiroWork";
    const fromEmail = (_d = input.fromEmail) !== null && _d !== void 0 ? _d : ((_e = process.env.RESEND_FROM_EMAIL) !== null && _e !== void 0 ? _e : "noreply@zirowork.com");
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
                reply_to: (_f = input.replyTo) !== null && _f !== void 0 ? _f : undefined,
                subject: input.subject,
                text: input.body,
                attachments: (_g = input.attachments) === null || _g === void 0 ? void 0 : _g.map(a => ({ path: a.path, filename: a.filename })),
            }),
        });
        if (!res.ok) {
            const errText = await res.text().catch(() => "unknown");
            console.error(`[sendEmail] Resend error ${res.status}: ${errText}`);
            return { success: false, error: `Resend ${res.status}: ${errText}` };
        }
        const json = await res.json().catch(() => ({}));
        return { success: true, messageId: json.id };
    }
    catch (err) {
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
    description: "Send a transactional email to a lead, student, or family member. Use this to send welcome emails, follow-ups, billing notices, or any outreach.",
    input_schema: {
        type: "object",
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
            attachments: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        path: { type: "string", description: "URL or path to the attachment file" },
                        filename: { type: "string", description: "Filename for the attachment" },
                    },
                    required: ["path", "filename"],
                },
                description: "Optional list of file attachments",
            },
        },
        required: ["to", "subject", "body"],
    },
};

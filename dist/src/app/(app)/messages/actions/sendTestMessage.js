"use server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { assertTenantAccess, requirePermission } from "@/lib/auth/guards";
import { resolveMessagingEmailIdentity } from "@/lib/branding/messagingIntegration";
import { renderTemplate } from "@/lib/messaging/integrations";
const MAX_BODY = 120000;
async function getAuthUserEmail() {
    var _a;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key)
        return null;
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
                }
                catch (_a) {
                    return;
                }
            },
        },
    });
    const { data: { session }, error, } = await client.auth.getSession();
    if (error || !((_a = session === null || session === void 0 ? void 0 : session.user) === null || _a === void 0 ? void 0 : _a.email))
        return null;
    return session.user.email.trim() || null;
}
/**
 * Sends a one-off test email to the signed-in user's auth email.
 * Does not create threads, messages, or delivery rows.
 */
export async function sendTestMessage(input) {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const session = await requirePermission("messages.write")();
        await assertTenantAccess(session.tenantId);
        const to = await getAuthUserEmail();
        if (!to)
            return { ok: false };
        let body = ((_a = input.body) !== null && _a !== void 0 ? _a : "").trim();
        if (body.length > MAX_BODY)
            return { ok: false };
        let subject = ((_b = input.subject) !== null && _b !== void 0 ? _b : "").trim() || null;
        if (input.templateId) {
            const rendered = await renderTemplate(session.tenantId, input.templateId, ((_c = input.mergeVars) !== null && _c !== void 0 ? _c : {}));
            if (rendered) {
                if (!subject && ((_d = rendered.subject) === null || _d === void 0 ? void 0 : _d.trim()))
                    subject = rendered.subject.trim();
                if (!body && rendered.body.trim())
                    body = rendered.body.trim();
            }
        }
        if (!body)
            return { ok: false };
        const apiKey = ((_e = process.env.RESEND_API_KEY) === null || _e === void 0 ? void 0 : _e.trim()) ||
            ((_f = process.env.MESSAGING_RESEND_API_KEY) === null || _f === void 0 ? void 0 : _f.trim());
        if (!apiKey)
            return { ok: false };
        const identity = await resolveMessagingEmailIdentity(session.tenantId);
        const fromHeader = `${identity.fromName} <${identity.fromEmail}>`;
        const subjectLine = (subject === null || subject === void 0 ? void 0 : subject.length) ? subject : "[ZiroWork] Messaging test";
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "content-type": "application/json",
            },
            body: JSON.stringify({
                from: fromHeader,
                to: [to],
                reply_to: (_g = identity.replyTo) !== null && _g !== void 0 ? _g : undefined,
                subject: `[Test] ${subjectLine}`,
                text: body,
            }),
        });
        if (!res.ok)
            return { ok: false };
        return { ok: true };
    }
    catch (_h) {
        return { ok: false };
    }
}

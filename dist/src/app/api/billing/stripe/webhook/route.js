import { ok, serverError } from "@/lib/http";
import { handleStripeWebhookEvent, verifyStripeWebhook, } from "@/lib/billing/stripe";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req) {
    try {
        const signature = req.headers.get("stripe-signature");
        if (!signature) {
            return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
                status: 400,
                headers: { "content-type": "application/json" },
            });
        }
        const payload = await req.text();
        const event = verifyStripeWebhook(payload, signature);
        await handleStripeWebhookEvent(event);
        return ok({ received: true, eventType: event.type });
    }
    catch (error) {
        return serverError(error);
    }
}

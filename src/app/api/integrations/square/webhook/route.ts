import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Square Webhook Receiver
 * Add this URL in Square Developer Dashboard → Webhooks:
 * https://ziro-work.vercel.app/api/integrations/square/webhook
 *
 * Recommended events to subscribe to:
 *   - invoice.created
 *   - invoice.updated
 *   - invoice.payment_made
 *   - invoice.canceled
 *   - payment.created
 *   - payment.updated
 *   - refund.created
 */

function verifySquareSignature(
  body: string,
  signature: string | null,
  signingKey: string,
  notificationUrl: string
): boolean {
  if (!signature || !signingKey) return false;
  // Square HMAC-SHA256: key = signingKey, message = notificationUrl + body
  const hmac = crypto.createHmac("sha256", signingKey);
  hmac.update(notificationUrl + body);
  const expected = hmac.digest("base64");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");
  const signingKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? "";
  const notificationUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://ziro-work.vercel.app"}/api/integrations/square/webhook`;

  // Verify signature if key is configured
  if (signingKey) {
    const valid = verifySquareSignature(rawBody, signature, signingKey, notificationUrl);
    if (!valid) {
      console.warn("[Square Webhook] Invalid signature — rejecting");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.type as string;
  console.log("[Square Webhook] Received event:", eventType, event.event_id);

  // Route events
  switch (eventType) {
    case "invoice.payment_made":
    case "invoice.updated":
    case "invoice.created":
    case "invoice.canceled":
      // TODO: upsert into square_invoices table
      console.log("[Square Webhook] Invoice event:", eventType, (event.data as Record<string, unknown>)?.id);
      break;

    case "payment.created":
    case "payment.updated":
      // TODO: upsert into square_payments table
      console.log("[Square Webhook] Payment event:", eventType);
      break;

    case "refund.created":
      // TODO: upsert into square_refunds table
      console.log("[Square Webhook] Refund event:", eventType);
      break;

    default:
      console.log("[Square Webhook] Unhandled event type:", eventType);
  }

  return NextResponse.json({ received: true });
}

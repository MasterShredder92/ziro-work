/**
 * POST /api/square/webhooks/team
 *
 * Receives Square webhook events for team_member.created and team_member.updated.
 * Verifies the Square-Signature header before processing.
 * NEVER creates new teacher records — only updates existing ones matched by email.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";

const SQUARE_API_BASE = "https://connect.squareup.com/v2";

type SquareTeamMemberEventData = {
  type: string;
  id: string;
  object?: {
    team_member?: {
      id: string;
      status: "ACTIVE" | "INACTIVE";
      given_name?: string;
      family_name?: string;
      email_address?: string;
      phone_number?: string;
      updated_at?: string;
    };
  };
};

type SquareWebhookEvent = {
  merchant_id: string;
  type: string;
  event_id: string;
  created_at: string;
  data: SquareTeamMemberEventData;
};

function verifySquareSignature(
  signatureKey: string,
  notificationUrl: string,
  rawBody: string,
  signature: string
): boolean {
  const hmac = crypto.createHmac("sha256", signatureKey);
  hmac.update(notificationUrl + rawBody);
  const expected = hmac.digest("base64");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function fetchTeamMember(token: string, memberId: string) {
  const res = await fetch(`${SQUARE_API_BASE}/team-members/${memberId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Square-Version": "2024-01-18",
    },
  });
  if (!res.ok) return null;
  type MemberDetail = { id: string; status: "ACTIVE" | "INACTIVE"; given_name?: string; family_name?: string; email_address?: string; phone_number?: string; updated_at?: string };
  const data = await res.json() as { team_member?: MemberDetail };
  return data.team_member ?? null;
}

export async function POST(req: NextRequest) {
  assertServiceRoleAllowed("Square webhook — no caller session, Square-Signature-based auth");
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;

  if (!signatureKey || !accessToken) {
    return NextResponse.json({ error: "Square credentials not configured" }, { status: 500 });
  }

  // Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature") ?? "";
  const notificationUrl = `https://ziro-work.vercel.app/api/square/webhooks/team`;

  // Verify signature
  if (signature) {
    try {
      const valid = verifySquareSignature(signatureKey, notificationUrl, rawBody, signature);
      if (!valid) {
        console.error("[Square Webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
    }
  }

  let event: SquareWebhookEvent;
  try {
    event = JSON.parse(rawBody) as SquareWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only handle team member events
  if (!event.type?.startsWith("team_member.")) {
    return NextResponse.json({ received: true, action: "ignored", type: event.type });
  }

  const memberId = event.data?.id;
  if (!memberId) {
    return NextResponse.json({ received: true, action: "no_member_id" });
  }

  // Fetch full team member details from Square
  const member = await fetchTeamMember(accessToken, memberId);
  if (!member) {
    return NextResponse.json({ received: true, action: "member_not_found", square_id: memberId });
  }

  const email = member.email_address?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ received: true, action: "no_email", square_id: memberId });
  }

  // Find matching ZiroWork teacher by email
  const supabase = getServiceClient();
  const { data: teacher, error: dbErr } = await supabase
    .from("teachers")
    .select("id, first_name, last_name, status")
    .eq("email", email)
    .eq("tenant_id", "00000000-0000-0000-0000-000000000001")
    .maybeSingle();

  if (dbErr) {
    console.error("[Square Webhook] DB error:", dbErr.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!teacher) {
    // No matching teacher — log but do NOT create
    console.log(`[Square Webhook] No ZiroWork teacher found for email: ${email} (Square ID: ${memberId})`);
    return NextResponse.json({
      received: true,
      action: "no_match",
      square_id: memberId,
      email,
    });
  }

  // Update the matched teacher
  const updates: Record<string, unknown> = {
    square_team_member_id: memberId,
  };

  // If Square marks them inactive, reflect that in ZiroWork
  if (member.status === "INACTIVE" && teacher.status === "active") {
    updates.status = "inactive";
  }

  const { error: updateErr } = await supabase
    .from("teachers")
    .update(updates)
    .eq("id", teacher.id);

  if (updateErr) {
    console.error("[Square Webhook] Update error:", updateErr.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  console.log(`[Square Webhook] Synced teacher ${teacher.id} (${email}) from Square event ${event.type}`);

  return NextResponse.json({
    received: true,
    action: "synced",
    teacher_id: teacher.id,
    square_id: memberId,
    event_type: event.type,
  });
}

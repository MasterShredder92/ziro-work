/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

/**
 * Square Bookings Webhook Handler
 *
 * Register this URL in Square Developer Dashboard → Webhooks:
 *   https://app.zirowork.com/api/integrations/square/bookings-webhook
 *
 * Subscribe to these events:
 *   booking.created
 *   booking.updated   (covers cancellations — status becomes CANCELLED)
 *   team_member.created
 *   team_member.updated
 *   card.created
 *   card.disabled
 *
 * What this handler does:
 *   booking.created / booking.updated:
 *     1. Resolve Square customer_id → families.square_customer_id → family + student
 *     2. Resolve Square team_member_id → teachers.square_team_member_id → teacher
 *     3. Resolve Square location_id → locations.square_location_id → location
 *     4. Upsert schedule_block for the booking date/time (keyed on metadata.square_booking_id)
 *     5. If booking is CANCELLED → set block status = 'cancelled'
 *     6. If student.teacher_id doesn't match block teacher → update student.teacher_id (block is truth)
 *
 *   team_member.created / team_member.updated:
 *     Sync Square team member status (ACTIVE/INACTIVE) → teachers.is_active + teachers.status
 *
 *   card.created:
 *     Set families.autopay_enabled = true, families.square_card_id = card.id
 *
 *   card.disabled:
 *     Set families.autopay_enabled = false, clear families.square_card_id if it matches
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOKING_WEBHOOK_URL =
  "https://app.zirowork.com/api/integrations/square/bookings-webhook";

function verifySquareSignature(
  body: string,
  signature: string | null,
  signingKey: string,
  notificationUrl: string,
): boolean {
  if (!signature || !signingKey) return false;
  const hmac = crypto.createHmac("sha256", signingKey);
  hmac.update(notificationUrl + body);
  const expected = hmac.digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function squareStatusToBlockStatus(squareStatus: string): string {
  switch (squareStatus.toUpperCase()) {
    case "ACCEPTED":
      return "scheduled";
    case "CANCELLED":
    case "CANCELED":
      return "cancelled";
    case "PENDING":
      return "scheduled";
    case "NO_SHOW":
      return "no_show";
    default:
      return "scheduled";
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  assertServiceRoleAllowed("Square bookings webhook — no caller session, HMAC signature-based auth");
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");
  const signingKey = process.env.SQUARE_BOOKINGS_WEBHOOK_SIGNATURE_KEY ?? "";

  if (!signingKey) {
    // Fail closed in production — missing key means webhook is not safe to process
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "WEBHOOK_NOT_CONFIGURED" }, { status: 503 });
    }
    // In dev/test, allow processing without a key
  } else {
    const valid = verifySquareSignature(
      rawBody,
      signature,
      signingKey,
      BOOKING_WEBHOOK_URL,
    );
    if (!valid) {
      return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const eventType: string = payload?.type ?? "";
  const db = getServiceClient();
  const tenantId = DEFAULT_TENANT_ID;

  // ── booking.created / booking.updated ─────────────────────────────────────
  if (eventType === "booking.created" || eventType === "booking.updated") {
    const booking = payload?.data?.object?.booking;
    if (!booking) return NextResponse.json({ ok: true });

    const squareBookingId: string = booking.id;
    const squareCustomerId: string | null = booking.customer_id ?? null;
    const squareLocationId: string | null = booking.location_id ?? null;
    const startAt: string | null = booking.start_at ?? null;
    const bookingStatus: string = booking.status ?? "ACCEPTED";
    const segment = booking.appointment_segments?.[0];
    const squareTeamMemberId: string | null =
      segment?.team_member_id ?? null;
    const durationMinutes: number = segment?.duration_minutes ?? 30;
    const sellerNote: string | null = booking.seller_note ?? null;

    if (!startAt) return NextResponse.json({ ok: true });

    // Parse date and times from start_at (ISO UTC)
    const startDate = new Date(startAt);
    const blockDate = startDate.toISOString().split("T")[0];
    const startHH = startDate.getUTCHours().toString().padStart(2, "0");
    const startMM = startDate.getUTCMinutes().toString().padStart(2, "0");
    const startTime = `${startHH}:${startMM}:00`;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const endHH = endDate.getUTCHours().toString().padStart(2, "0");
    const endMM = endDate.getUTCMinutes().toString().padStart(2, "0");
    const endTime = `${endHH}:${endMM}:00`;

    const blockStatus = squareStatusToBlockStatus(bookingStatus);

    // 1. Resolve location
    let locationId: string | null = null;
    if (squareLocationId) {
      const { data: loc } = await db
        .from("locations")
        .select("id")
        .eq("square_location_id", squareLocationId)
        .eq("tenant_id", tenantId)
        .maybeSingle();
      locationId = loc?.id ?? null;
    }

    // 2. Resolve teacher via square_team_member_id
    let teacherId: string | null = null;
    if (squareTeamMemberId) {
      const { data: teacher } = await db
        .from("teachers")
        .select("id")
        .eq("square_team_member_id", squareTeamMemberId)
        .eq("tenant_id", tenantId)
        .maybeSingle();
      teacherId = teacher?.id ?? null;
    }

    // 3. Resolve family + student via square_customer_id
    let familyId: string | null = null;
    let studentId: string | null = null;
    if (squareCustomerId) {
      const { data: family } = await db
        .from("families")
        .select("id")
        .eq("square_customer_id", squareCustomerId)
        .eq("tenant_id", tenantId)
        .maybeSingle();
      familyId = family?.id ?? null;

      if (familyId && teacherId) {
        // Find the active student in this family assigned to this teacher
        // (or any active student if only one)
        const { data: students } = await db
          .from("students")
          .select("id, teacher_id")
          .eq("family_id", familyId)
          .eq("status", "active")
          .eq("tenant_id", tenantId);

        if (students && students.length === 1) {
          studentId = students[0].id;
          // Fix teacher mismatch if block teacher differs from student record
          if (teacherId && students[0].teacher_id !== teacherId) {
            await db
              .from("students")
              .update({ teacher_id: teacherId, updated_at: new Date().toISOString() })
              .eq("id", studentId);
          }
        } else if (students && students.length > 1) {
          // Multiple students — match by teacher first
          const match = students.find((s) => s.teacher_id === teacherId);
          studentId = match?.id ?? students[0].id;
        }
      } else if (familyId) {
        // No teacher resolved — just grab first active student
        const { data: students } = await db
          .from("students")
          .select("id")
          .eq("family_id", familyId)
          .eq("status", "active")
          .eq("tenant_id", tenantId)
          .limit(1);
        studentId = students?.[0]?.id ?? null;
      }
    }

    // 4. Upsert schedule_block keyed on metadata->square_booking_id
    // Check if a block already exists for this booking
    const { data: existingBlocks } = await db
      .from("schedule_blocks")
      .select("id")
      .eq("tenant_id", tenantId)
      .filter("metadata->>square_booking_id", "eq", squareBookingId)
      .limit(1);

    const existingBlockId = existingBlocks?.[0]?.id ?? null;

    const blockPayload: Record<string, any> = {
      tenant_id: tenantId,
      block_date: blockDate,
      start_time: startTime,
      end_time: endTime,
      status: blockStatus,
      block_type: "student_session",
      is_recurring: false,
      teacher_id: teacherId,
      student_id: studentId,
      location_id: locationId,
      notes: sellerNote,
      metadata: { square_booking_id: squareBookingId, source: "square_booking" },
      updated_at: new Date().toISOString(),
    };

    if (existingBlockId) {
      await db
        .from("schedule_blocks")
        .update(blockPayload)
        .eq("id", existingBlockId);
    } else {
      await db
        .from("schedule_blocks")
        .insert({ ...blockPayload, created_at: new Date().toISOString() });
    }

    return NextResponse.json({ ok: true, event: eventType, bookingId: squareBookingId });
  }

  // ── team_member.created / team_member.updated ──────────────────────────────
  if (
    eventType === "team_member.created" ||
    eventType === "team_member.updated"
  ) {
    const member = payload?.data?.object?.team_member;
    if (!member) return NextResponse.json({ ok: true });

    const squareTeamMemberId: string = member.id;
    const isActive: boolean = member.status === "ACTIVE";
    const status = isActive ? "active" : "inactive";
    const givenName: string | null = member.given_name ?? null;
    const familyName: string | null = member.family_name ?? null;

    // Check if teacher exists with this square_team_member_id
    const { data: existing } = await db
      .from("teachers")
      .select("id, display_name")
      .eq("square_team_member_id", squareTeamMemberId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (existing) {
      // Update status only — don't overwrite display_name if already set
      await db
        .from("teachers")
        .update({
          is_active: isActive,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else if (eventType === "team_member.created" && givenName) {
      // New team member — create teacher record
      await db.from("teachers").insert({
        tenant_id: tenantId,
        first_name: givenName,
        last_name: familyName ?? "",
        display_name: `${givenName} ${familyName ?? ""}`.trim(),
        square_team_member_id: squareTeamMemberId,
        is_active: isActive,
        status,
        instruments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, event: eventType, memberId: squareTeamMemberId });
  }

  // ── card.created ───────────────────────────────────────────────────────────
  if (eventType === "card.created") {
    const card = payload?.data?.object?.card;
    if (!card) return NextResponse.json({ ok: true });

    const squareCustomerId: string | null = card.customer_id ?? null;
    const cardId: string = card.id;

    if (squareCustomerId) {
      await db
        .from("families")
        .update({
          autopay_enabled: true,
          square_card_id: cardId,
          updated_at: new Date().toISOString(),
        })
        .eq("square_customer_id", squareCustomerId)
        .eq("tenant_id", tenantId);
    }

    return NextResponse.json({ ok: true, event: eventType, cardId });
  }

  // ── card.disabled ──────────────────────────────────────────────────────────
  if (eventType === "card.disabled") {
    const card = payload?.data?.object?.card;
    if (!card) return NextResponse.json({ ok: true });

    const squareCustomerId: string | null = card.customer_id ?? null;
    const cardId: string = card.id;

    if (squareCustomerId) {
      // Only clear autopay if this is the card we have on file
      const { data: family } = await db
        .from("families")
        .select("id, square_card_id")
        .eq("square_customer_id", squareCustomerId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (family && family.square_card_id === cardId) {
        await db
          .from("families")
          .update({
            autopay_enabled: false,
            square_card_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", family.id);
      }
    }

    return NextResponse.json({ ok: true, event: eventType, cardId });
  }

  // Unknown event — acknowledge and ignore
  return NextResponse.json({ ok: true, event: eventType, action: "ignored" });
}

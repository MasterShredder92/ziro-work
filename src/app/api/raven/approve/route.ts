/**
 * POST /api/raven/approve
 * Approves or rejects a pending RAVEN message.
 *
 * Body:
 *   { id: string, action: "approve" | "reject", tenant_id?: string }
 *
 * On approve:
 *   1. Updates raven_message_log status → "approved"
 *   2. Fires POST to AGENT_API_URL/events/raven/process with approved=true
 *
 * On reject:
 *   1. Updates raven_message_log status → "rejected"
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

function getPlatformClient() {
  const url = process.env.PLATFORM_SUPABASE_URL;
  const key = process.env.PLATFORM_SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("PLATFORM_SUPABASE_URL and PLATFORM_SUPABASE_SERVICE_KEY must be set");
  }
  return createClient(url, key);
}

export async function POST(request: Request) {
  let body: { id: string; action: "approve" | "reject"; tenant_id?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, action, tenant_id } = body;
  const tenantId = tenant_id || DEFAULT_TENANT_ID;

  if (!id || !action) {
    return NextResponse.json({ error: "id and action are required" }, { status: 422 });
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 422 });
  }

  try {
    const client = getPlatformClient();

    // Fetch the message row first
    const { data: rows, error: fetchError } = await client
      .from("raven_message_log")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .limit(1);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const row = rows[0];

    if (row.status !== "pending_approval") {
      return NextResponse.json(
        { error: `Message is already in status: ${row.status}` },
        { status: 409 }
      );
    }

    if (action === "reject") {
      const { error: updateError } = await client
        .from("raven_message_log")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, status: "rejected" });
    }

    // action === "approve"
    const { error: updateError } = await client
      .from("raven_message_log")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Fire to agent API
    const agentApiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL;
    if (agentApiUrl) {
      try {
        const ravenPayloadRaw = row.raven_payload;
        const ravenPayload =
          typeof ravenPayloadRaw === "string"
            ? JSON.parse(ravenPayloadRaw)
            : ravenPayloadRaw ?? {};

        await fetch(`${agentApiUrl}/events/raven/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenantId,
            event_type: "raven_send_requested",
            entity_id: id,
            location_id: row.location_id ?? "",
            metadata: {
              approved: true,
              queue_id: id,
              raven_payload: {
                ...ravenPayload,
                approved: true,
                _resolved_phone: row.recipient_phone,
                _resolved_email: row.recipient_email,
                _resolved_message: row.message_body,
                _resolved_channel: row.channel,
                _resolved_framework: row.framework_used,
                location_slug: row.location_slug ?? "omaha",
              },
            },
          }),
        });
      } catch (fireErr) {
        console.error("[/api/raven/approve] Agent API fire failed:", fireErr);
        // Don't fail the approval — message is already marked approved in DB
      }
    }

    return NextResponse.json({ success: true, status: "approved" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

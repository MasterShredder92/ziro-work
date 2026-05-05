/**
 * POST /api/raven/retry
 * Resets a failed RAVEN message for re-send.
 *
 * Body: { id: string }
 *
 * Flow:
 *   1. Verifies message is in send_failed or send_failed_permanent status
 *   2. Resets retry_count to 0, status to "approved"
 *   3. Fires /events/raven/send (fire-and-forget)
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
  let body: { id: string; tenant_id?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, tenant_id } = body;
  const tenantId = tenant_id || DEFAULT_TENANT_ID;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 422 });
  }

  try {
    const client = getPlatformClient();

    // Fetch the message
    const { data: rows, error: fetchError } = await client
      .from("raven_message_log")
      .select("id, status, tenant_id")
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

    if (!["send_failed", "send_failed_permanent"].includes(row.status)) {
      return NextResponse.json(
        { error: `Cannot retry message in status: ${row.status}` },
        { status: 409 }
      );
    }

    // Reset for retry
    const { error: updateError } = await client
      .from("raven_message_log")
      .update({
        status: "approved",
        retry_count: 0,
        error_message: null,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Fire-and-forget send
    const agentApiUrl = process.env.NEXT_PUBLIC_AGENT_API_URL;
    const ravenWebhookSecret = process.env.RAVEN_WEBHOOK_SECRET;

    if (agentApiUrl && ravenWebhookSecret) {
      fetch(`${agentApiUrl}/events/raven/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Raven-Secret": ravenWebhookSecret,
        },
        body: JSON.stringify({ message_log_id: id }),
      }).catch((err) => {
        console.error("[/api/raven/retry] Agent send fire failed:", err);
      });
    }

    return NextResponse.json({ success: true, status: "retry_queued" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

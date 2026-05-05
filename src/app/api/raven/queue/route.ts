/**
 * GET /api/raven/queue
 * Returns raven_message_log rows for one or more statuses.
 *
 * Query params:
 *   tenant_id: string (optional, defaults to DEFAULT_TENANT_ID)
 *   status: string (repeatable — e.g. ?status=pending_approval&status=send_failed)
 *
 * Used by the dead letter queue UI at /director/crew/approvals.
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

const ALLOWED_STATUSES = [
  "pending_approval",
  "send_failed",
  "send_failed_permanent",
  "rejected",
  "sent",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id") || DEFAULT_TENANT_ID;
  const statusParams = searchParams.getAll("status");

  // Default to pending_approval if no status specified
  const statuses =
    statusParams.length > 0
      ? statusParams.filter((s) => ALLOWED_STATUSES.includes(s))
      : ["pending_approval"];

  if (statuses.length === 0) {
    return NextResponse.json({ error: "No valid statuses provided" }, { status: 422 });
  }

  try {
    const client = getPlatformClient();

    const { data, error } = await client
      .from("raven_message_log")
      .select(
        "id, tenant_id, event_id, from_agent, channel, recipient_phone, recipient_email, " +
          "recipient_name, location_id, framework_used, message_body, subject, status, " +
          "retry_count, error_message, requires_approval, created_at"
      )
      .eq("tenant_id", tenantId)
      .in("status", statuses)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data ?? [], count: (data ?? []).length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

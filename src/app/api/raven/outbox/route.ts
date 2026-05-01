/**
 * GET /api/raven/outbox
 * Returns all raven_message_log rows with status = "pending_approval"
 * for the current tenant, ordered by created_at desc.
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id") || DEFAULT_TENANT_ID;
  const status = searchParams.get("status") || "pending_approval";

  try {
    const client = getPlatformClient();

    const { data, error } = await client
      .from("raven_message_log")
      .select(
        "id, tenant_id, event_id, from_agent, channel, recipient_phone, recipient_email, " +
        "recipient_name, location_id, location_slug, framework_used, outbound_type, " +
        "message_body, subject, status, requires_approval, sms_enabled, created_at"
      )
      .eq("tenant_id", tenantId)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data ?? [], count: (data ?? []).length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

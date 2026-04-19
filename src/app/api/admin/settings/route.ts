import { NextRequest } from "next/server";
import { readJson, ok } from "@/lib/http";
import { readSettings, writeSettings } from "@/lib/admin/settings";
import {
  resolveContext,
  requirePermission,
  requireRole,
} from "../_context";
import { handleError } from "../_handle";
import type { TenantSettingsInput } from "@/lib/admin/adminTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { session, tenantId } = await resolveContext(req);
    requireRole(session, "director");
    requirePermission(session, "admin.settings.read");
    const data = await readSettings(tenantId);
    return ok({ data });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, tenantId } = await resolveContext(req);
    requireRole(session, "admin");
    requirePermission(session, "admin.settings.write");
    const body = (await readJson<TenantSettingsInput>(req)) ?? {};
    const data = await writeSettings(tenantId, body);
    return ok({ data });
  } catch (err) {
    return handleError(err);
  }
}

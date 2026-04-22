import { NextRequest, NextResponse } from "next/server";
import { readJson, ok } from "@/lib/http";
import {
  getTenantProfile,
  updateTenantProfile,
} from "@/lib/admin/settings";
import {
  resolveContext,
  requirePermission,
  requireRole,
} from "../_context";
import { handleError } from "../_handle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { session, tenantId } = await resolveContext(req);
    requireRole(session, "director");
    requirePermission(session, "admin.read");
    const tenant = await getTenantProfile(tenantId);
    return ok({ data: tenant });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, tenantId } = await resolveContext(req);
    requireRole(session, "admin");
    requirePermission(session, "admin.settings.write");
    const body = (await readJson<Record<string, unknown>>(req)) ?? {};
    const updated = await updateTenantProfile(tenantId, {
      name: typeof body.name === "string" ? body.name : undefined,
      slug: (body.slug as string | null | undefined) ?? undefined,
      logo_url: (body.logo_url as string | null | undefined) ?? undefined,
      primary_color:
        (body.primary_color as string | null | undefined) ?? undefined,
      accent_color:
        (body.accent_color as string | null | undefined) ?? undefined,
      timezone: (body.timezone as string | null | undefined) ?? undefined,
      plan: (body.plan as string | null | undefined) ?? undefined,
      // locale and status are not columns in the tenants table — omitted
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    return handleError(err);
  }
}

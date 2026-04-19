import type { NextRequest } from "next/server";
import { ok, readJson, serverError } from "@/lib/http";
import { listBrandingLayouts, saveLayout } from "@/lib/branding";
import type { PortalScope } from "@/lib/branding/types";
import {
  jsonAdminError,
  resolveBrandingAdminOperatorContext,
} from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await resolveBrandingAdminOperatorContext(req);
    const layouts = await listBrandingLayouts(tenantId);
    return ok({ data: { layouts, tenantId } });
  } catch (err) {
    const j = jsonAdminError(err);
    if (j) return j;
    return serverError(err);
  }
}

type PatchBody = {
  layout?: Partial<{
    scope: PortalScope;
    preset: string;
    sidebar_variant: string;
    dashboard_preset: string;
    widgets: unknown[];
    header_extras: string[];
    footer_extras: string[];
  }>;
};

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId } = await resolveBrandingAdminOperatorContext(req);
    const body = (await readJson<PatchBody>(req)) ?? {};
    if (!body.layout?.scope) {
      return Response.json({ error: "layout.scope required" }, { status: 400 });
    }
    const layout = await saveLayout(tenantId, {
      ...body.layout,
      scope: body.layout.scope,
    } as Parameters<typeof saveLayout>[1]);
    return ok({ data: { layout } });
  } catch (err) {
    const j = jsonAdminError(err);
    if (j) return j;
    return serverError(err);
  }
}

import type { NextRequest } from "next/server";
import {
  getBrandingDashboard,
  getBrandingProfile,
  publishBrandingProfile,
  saveBrandingDraft,
  saveBrandingProfile,
} from "@/lib/branding";
import type { BrandingDraftPayload, BrandingProfile } from "@/lib/branding/types";
import { readJson, ok } from "@/lib/http";
import { handleError } from "@/app/api/admin/_handle";
import { logAudit } from "@/lib/audit/log";
import {
  resolveBrandingAdminOperatorContext,
  resolveBrandingProfileReadContext,
} from "../_auth";
import { AdminApiError } from "@/app/api/admin/_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PatchBody = {
  tenantId?: string;
  patch?: Partial<BrandingProfile> & { id?: string };
  draft?: BrandingDraftPayload;
  publishId?: string;
};

export async function GET(req: NextRequest) {
  try {
    const { session, tenantId } = await resolveBrandingProfileReadContext(req);
    const url = new URL(req.url);
    if (url.searchParams.get("view") === "dashboard") {
      const data = await getBrandingDashboard(tenantId);
      await logAudit("branding.dashboard.read", {
        tenantId,
        profileId: session.userId,
        role: session.role,
        source: "api",
      });
      return ok({ data });
    }
    const profile = await getBrandingProfile(tenantId);
    await logAudit("branding.profile.read", {
      tenantId,
      profileId: session.userId,
      role: session.role,
      source: "api",
    });
    return ok({ data: profile });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, tenantId } = await resolveBrandingAdminOperatorContext(req);
    const body = (await readJson<PatchBody>(req)) ?? {};

    if (body.publishId) {
      const updated = await publishBrandingProfile(
        tenantId,
        body.publishId,
        session.userId ?? null,
      );
      return ok({ data: updated });
    }

    if (body.draft && body.patch?.id) {
      const updated = await saveBrandingDraft(
        tenantId,
        body.patch.id,
        body.draft,
      );
      return ok({ data: updated });
    }

    if (!body.patch || typeof body.patch !== "object") {
      throw new AdminApiError("INVALID_BODY", 400);
    }

    const updated = await saveBrandingProfile(tenantId, body.patch);
    return ok({ data: updated });
  } catch (err) {
    return handleError(err);
  }
}

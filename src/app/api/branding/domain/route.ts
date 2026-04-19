import type { NextRequest } from "next/server";
import { badRequest, ok, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import {
  activateDomain,
  createDomain,
  listBrandingDomains,
  markDomainVerified,
  removeDomain,
  verifyDomain,
} from "@/lib/branding";
import {
  jsonAdminError,
  resolveBrandingAdminOperatorContext,
} from "../_auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveBrandingAdminOperatorContext(req);
    const domains = await listBrandingDomains(ctx.tenantId);
    await logAudit("branding.domain.list", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      source: "api",
    });
    return ok({ data: { domains } });
  } catch (err) {
    const j = jsonAdminError(err);
    if (j) return j;
    return serverError(err);
  }
}

type PostBody = {
  domain_name?: string;
  is_primary?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const ctx = await resolveBrandingAdminOperatorContext(req);
    const body = (await readJson<PostBody>(req)) ?? {};
    const name = typeof body.domain_name === "string" ? body.domain_name : "";
    if (!name.trim()) return badRequest("domain_name required");
    const domain = await createDomain(ctx.tenantId, {
      domain_name: name,
      is_primary: body.is_primary,
    });
    await logAudit("branding.domain.create", {
      tenantId: ctx.tenantId,
      domainId: domain.id,
      source: "api",
    });
    return ok({ data: { domain } });
  } catch (err) {
    const j = jsonAdminError(err);
    if (j) return j;
    return serverError(err);
  }
}

type DeleteBody = { id?: string };

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await resolveBrandingAdminOperatorContext(req);
    const body = (await readJson<DeleteBody>(req)) ?? {};
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return badRequest("id required");
    await removeDomain(ctx.tenantId, id);
    await logAudit("branding.domain.delete", {
      tenantId: ctx.tenantId,
      domainId: id,
      source: "api",
    });
    return ok({ data: { ok: true } });
  } catch (err) {
    const j = jsonAdminError(err);
    if (j) return j;
    return serverError(err);
  }
}

type PatchBody = {
  id?: string;
  action?: "verify" | "mark_verified" | "activate";
};

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await resolveBrandingAdminOperatorContext(req);
    const body = (await readJson<PatchBody>(req)) ?? {};
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return badRequest("id required");
    const action = body.action ?? "verify";

    let domain;
    if (action === "mark_verified") {
      domain = await markDomainVerified(ctx.tenantId, id);
    } else if (action === "activate") {
      domain = await activateDomain(ctx.tenantId, id);
    } else {
      await verifyDomain(ctx.tenantId, id);
      domain = await markDomainVerified(ctx.tenantId, id);
    }

    await logAudit("branding.domain.verify", {
      tenantId: ctx.tenantId,
      domainId: id,
      action,
      source: "api",
    });
    return ok({ data: { domain } });
  } catch (err) {
    const j = jsonAdminError(err);
    if (j) return j;
    return serverError(err);
  }
}

import { NextRequest } from "next/server";
import { created, ok, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import {
  createVersion,
  getContentItem,
  listVersions,
} from "@/lib/content";
import { fireContentItemEvent } from "@/lib/content/triggers";
import {
  resolveContentApiContext,
  toAuthErrorResponse,
} from "../../_context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await resolveContentApiContext(req);
    const versions = await listVersions(id, ctx.tenantId);

    await logAudit("content.api.versions.list", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      itemId: id,
      count: versions.length,
    });

    return ok({ data: versions });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const ctx = await resolveContentApiContext(req, { requireWrite: true });
    const body = await readJson<{ changeSummary?: string | null }>(req);

    const version = await createVersion(id, ctx.tenantId, {
      changeSummary: body?.changeSummary ?? null,
      createdBy: ctx.session.userId,
    });

    const item = await getContentItem(id, ctx.tenantId);
    if (item) {
      await fireContentItemEvent("content.version.created", item, {
        versionId: version.id,
        versionNumber: version.version,
      }).catch(() => null);
    }

    await logAudit("content.api.versions.create", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      itemId: id,
      versionId: version.id,
      versionNumber: version.version,
    });

    return created({ data: version });
  } catch (err) {
    return toAuthErrorResponse(err) ?? serverError(err);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { ok, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import {
  addItemToCollection,
  getContentCollectionSurface,
  removeItemFromCollection,
} from "@/lib/content";
import { resolveContentContext } from "../../../guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function forbidden(message = "FORBIDDEN"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const tenantParam = url.searchParams.get("tenantId")?.trim() || null;

    let ctx;
    try {
      ctx = await resolveContentContext({ tenantId: tenantParam });
    } catch (err) {
      const message = err instanceof Error ? err.message : "FORBIDDEN";
      return forbidden(message);
    }

    const surface = await getContentCollectionSurface(id, ctx.tenantId);
    if (!surface) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const filtered =
      ctx.session.role === "student" || ctx.session.role === "family"
        ? {
            ...surface,
            items: surface.items.filter(
              (i) => i.visibility === "public" || i.visibility === "tenant",
            ),
          }
        : surface;

    await logAudit("content.collection.view", {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      collectionId: id,
      itemCount: filtered.items.length,
      source: "api",
    });

    return ok({ data: filtered });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    let ctx;
    try {
      ctx = await resolveContentContext({ requireWrite: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "FORBIDDEN";
      return forbidden(message);
    }

    const body = (await req.json().catch(() => ({}))) as {
      itemId?: string;
      action?: "add" | "remove";
    };

    const itemId = body.itemId?.trim();
    const action = body.action ?? "add";
    if (!itemId) {
      return NextResponse.json(
        { error: "itemId is required" },
        { status: 400 },
      );
    }

    const result =
      action === "remove"
        ? await removeItemFromCollection(itemId, id, ctx.tenantId)
        : await addItemToCollection(itemId, id, ctx.tenantId);

    await logAudit(`content.collection.${action}`, {
      tenantId: ctx.tenantId,
      profileId: ctx.session.userId,
      role: ctx.session.role,
      collectionId: id,
      itemId,
      source: "api",
    });

    return ok({ data: result });
  } catch (err) {
    return serverError(err);
  }
}

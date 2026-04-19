import { NextRequest } from "next/server";
import { z } from "zod";
import {
  deleteSessionLog,
  getSessionLogById,
  updateSessionLog,
} from "@data/sessionLog";
import type { SessionLogUpdate } from "@/lib/types/entities";
import { requirePermission } from "@/lib/auth/guards";
import { assertLocationAllowed, resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import {
  badRequest,
  noContent,
  notFound,
  ok,
  readJson,
  serverError,
} from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("schedule.read")();
    const { id } = await ctx.params;
    const tenantId = session.tenantId;
    const row = await getSessionLogById(id, tenantId);
    if (!row) return notFound();
    const access = await resolveUserLocationAccess({
      session,
      preferredLocationId: row.location_id,
      autoRepairProfileLocation: true,
    });
    const allowedLocationId = assertLocationAllowed(access, row.location_id);
    if (!allowedLocationId || allowedLocationId !== row.location_id) {
      return badRequest("Location access denied");
    }
    return ok({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

const SessionLogUpdateSchema = z.object({}).passthrough();

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("schedule.write")();
    const { id } = await ctx.params;
    const tenantId = session.tenantId;
    const current = await getSessionLogById(id, tenantId);
    if (!current) return notFound();
    const access = await resolveUserLocationAccess({
      session,
      preferredLocationId: current.location_id,
      autoRepairProfileLocation: true,
    });
    const currentLocationAllowed = assertLocationAllowed(access, current.location_id);
    if (!currentLocationAllowed || currentLocationAllowed !== current.location_id) {
      return badRequest("Location access denied");
    }
    const body = await readJson(req);
    const parsed = SessionLogUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid update payload", parsed.error.flatten());
    }
    const patch = { ...(parsed.data as Record<string, unknown>) };
    if (typeof patch.location_id === "string" && patch.location_id.trim().length > 0) {
      const nextLocationId = assertLocationAllowed(access, patch.location_id);
      if (!nextLocationId || nextLocationId !== patch.location_id) {
        return badRequest("Location access denied");
      }
    }
    const row = await updateSessionLog(id, tenantId, patch as unknown as SessionLogUpdate);
    return ok({ data: row });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await requirePermission("schedule.write")();
    const { id } = await ctx.params;
    const tenantId = session.tenantId;
    const row = await getSessionLogById(id, tenantId);
    if (!row) return notFound();
    const access = await resolveUserLocationAccess({
      session,
      preferredLocationId: row.location_id,
      autoRepairProfileLocation: true,
    });
    const allowedLocationId = assertLocationAllowed(access, row.location_id);
    if (!allowedLocationId || allowedLocationId !== row.location_id) {
      return badRequest("Location access denied");
    }
    await deleteSessionLog(id, tenantId);
    return noContent();
  } catch (err) {
    return serverError(err);
  }
}

import "server-only";
import type { NextRequest } from "next/server";
import { getRoomSurface } from "@/lib/locations/service";
import { resolveLocationsContext } from "../../../guard";
import { badRequest, notFound, ok, serverError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  void _req;
  try {
    await resolveLocationsContext();
    const { id } = await params;
    const roomId = id?.trim();
    if (!roomId) return badRequest("Missing room id");

    const data = await getRoomSurface(roomId);
    return ok({ data });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "FORBIDDEN") return badRequest("Forbidden");
      if (err.message === "ROOM_NOT_FOUND") return notFound("Room not found");
      if (err.message === "TENANT_MISMATCH")
        return badRequest("Tenant mismatch");
    }
    return serverError(err);
  }
}

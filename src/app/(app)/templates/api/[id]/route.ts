import { NextRequest } from "next/server";
import {
  GET as apiGet,
  PATCH as apiPatch,
  DELETE as apiDelete,
} from "@/app/api/templates/[id]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return apiGet(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  return apiPatch(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  return apiDelete(req, ctx);
}

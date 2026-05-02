import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ok } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/whoami
 * Lightweight client-readable session info.
 * Returns minimal fields. Used by UI to gate role-restricted controls.
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return ok({ authenticated: false, role: null, userId: null });
    }
    return ok({
      authenticated: true,
      role: session.role,
      userId: session.userId,
      baseRole: session.baseRole ?? null,
    });
  } catch {
    return ok({ authenticated: false, role: null, userId: null });
  }
}

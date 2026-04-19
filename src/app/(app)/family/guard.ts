import "server-only";
import { requireRole } from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";

export async function ensureFamilyAccess(): Promise<Session> {
  return requireRole("family")();
}

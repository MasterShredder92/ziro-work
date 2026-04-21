import "server-only";
import { requireRole } from "@/lib/auth/guards";
export async function ensureAdminAccess() {
    return requireRole("director")();
}

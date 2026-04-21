import "server-only";
import { requireRole } from "@/lib/auth/guards";
export async function ensureFamilyAccess() {
    return requireRole("family")();
}

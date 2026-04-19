import "server-only";
import { getPrimaryBrandingEmailIdentity } from "./queries";
import { applyEmailIdentity } from "./runtime";

/** Resolves outbound email envelope for Messaging OS deliveries. */
export async function resolveMessagingEmailIdentity(tenantId: string) {
  const row = await getPrimaryBrandingEmailIdentity(tenantId);
  return applyEmailIdentity(row);
}

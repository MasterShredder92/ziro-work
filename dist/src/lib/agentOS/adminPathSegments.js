import { canonicalAgentOSPathname, getPageTypeFromPathname, } from "./pageIntelligence";
/**
 * Returns the AgentOS page type for a URL. Uses `getPageBinding`, which resolves
 * nested routes by **rule specificity** (longest / most specific pattern wins),
 * with CRM catch‑all and other broad rules de‑prioritized.
 *
 * Alternate `/admin/students/…`, `/admin/families/…`, `/admin/billing/…` paths are
 * canonicalized to CRM/billing routes first — see `canonicalAgentOSPathname`.
 */
export function adminPathToPageSegment(pathname) {
    return getPageTypeFromPathname(pathname);
}
export { canonicalAgentOSPathname };

import type { CSSProperties } from "react";

/**
 * Same visual DNA as `DASHBOARD_SHELL_BACKDROP` in dashboard `_client.tsx`:
 * deep black, lime + neutral vignettes, subtle micro-grid.
 * Use behind module pages (e.g. CRM family) for consistency — only where theme is not light.
 */
export const OBSIDIAN_DARK_BACKDROP: Pick<
  CSSProperties,
  "backgroundColor" | "backgroundImage" | "backgroundSize" | "backgroundPosition" | "backgroundRepeat"
> = {
  backgroundColor: "#000000",
  backgroundImage: [
    "radial-gradient(circle at 50% 118%, rgba(180,255,0,0.034) 0%, transparent 48%)",
    "radial-gradient(circle at 50% -14%, rgba(255,255,255,0.02) 0%, transparent 34%)",
    "radial-gradient(circle at 100% 6%, rgba(52,52,52,0.14) 0%, transparent 38%)",
    "radial-gradient(circle at 0% 94%, rgba(46,46,46,0.12) 0%, transparent 38%)",
    "radial-gradient(ellipse 100% 78% at 50% 44%, rgba(10,10,10,0.78) 0%, transparent 72%)",
    "radial-gradient(rgba(255,255,255,0.012) 1px, transparent 1px)",
  ].join(", "),
  backgroundSize: "100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 36px 36px",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat, no-repeat, no-repeat, no-repeat, no-repeat, repeat",
};

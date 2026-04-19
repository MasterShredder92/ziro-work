const DEMO_SESSION_KEY = "ziro-work-demo-session";

/** True when build-time demo flag is on, or the user started a browser demo session. */
export function isZiroDemoMode(): boolean {
  if (typeof window !== "undefined" && window.sessionStorage.getItem(DEMO_SESSION_KEY) === "1") {
    return true;
  }
  return process.env.NEXT_PUBLIC_ZIRO_DEMO_MODE === "true";
}

export function setZiroDemoSession(enabled: boolean): void {
  if (typeof window === "undefined") return;
  if (enabled) window.sessionStorage.setItem(DEMO_SESSION_KEY, "1");
  else window.sessionStorage.removeItem(DEMO_SESSION_KEY);
}

export const ZIRO_TOUR_AUTOSTART_KEY = "ziro-work-start-tour";

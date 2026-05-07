"use client";

type Platform = {
  id: string;
  name: string;
  icon: string;
  color: string;
  glow: string;
  stats: { label: string; value: string }[];
  actions: { label: string; primary?: boolean }[];
  lastActivity: string;
  pending?: string;
};

const PLATFORMS: Platform[] = [
  {
    id: "google",
    name: "Google Business",
    icon: "G",
    color: "#4285F4",
    glow: "rgba(66,133,244,0.25)",
    stats: [
      { label: "Rating", value: "4.9 ★" },
      { label: "Reviews", value: "247" },
      { label: "Searches/mo", value: "1.2k" },
    ],
    actions: [
      { label: "Post Update" },
      { label: "Upload Photo" },
      { label: "Request Review", primary: true },
    ],
    lastActivity: "2 days ago",
    pending: "3 unanswered reviews",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "f",
    color: "#1877F2",
    glow: "rgba(24,119,242,0.25)",
    stats: [
      { label: "Followers", value: "2.4k" },
      { label: "Reach/mo", value: "8.1k" },
      { label: "Leads", value: "14" },
    ],
    actions: [
      { label: "Write Post" },
      { label: "Upload Photo" },
      { label: "Boost Post", primary: true },
    ],
    lastActivity: "5 hours ago",
    pending: "14 new leads",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "◈",
    color: "#E1306C",
    glow: "rgba(225,48,108,0.25)",
    stats: [
      { label: "Followers", value: "891" },
      { label: "Reach/mo", value: "3.2k" },
      { label: "Eng. Rate", value: "4.8%" },
    ],
    actions: [
      { label: "Write Caption" },
      { label: "Upload Reel" },
      { label: "Post Now", primary: true },
    ],
    lastActivity: "1 day ago",
  },
];

export function PlatformCards() {
  return (
    <div>
      {/* section header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
      }}>
        <div style={{
          width: 3, height: 22,
          background: "linear-gradient(180deg, #bf36f8, #4285F4)",
          borderRadius: 2,
          flexShrink: 0,
          boxShadow: "0 0 8px rgba(191,54,248,0.4)",
        }} />
        <span style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--z-fg)",
          fontFamily: "Space Grotesk, sans-serif",
        }}>
          Platform Intelligence
        </span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, var(--z-border), transparent)" }} />
        <span style={{ fontSize: 11, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
          Connect platforms to enable posting
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {PLATFORMS.map((p) => (
          <div
            key={p.id}
            style={{
              background: "var(--z-surface)",
              border: "1px solid var(--z-border)",
              borderTop: `3px solid ${p.color}`,
              borderRadius: 16,
              padding: "16px 16px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              position: "relative",
              overflow: "hidden",
              transition: "box-shadow 0.2s",
              cursor: "default",
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 24px ${p.glow}`)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
          >
            {/* bg glow */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 50,
              background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${p.color}12, transparent 70%)`,
              pointerEvents: "none",
            }} />

            {/* header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${p.color}22`,
                  border: `1px solid ${p.color}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 900, color: p.color,
                  fontFamily: "Space Grotesk, sans-serif",
                  boxShadow: `0 0 10px ${p.glow}`,
                }}>
                  {p.icon}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: 800,
                  color: "var(--z-fg)",
                  fontFamily: "Space Grotesk, sans-serif",
                }}>
                  {p.name}
                </span>
              </div>
              {/* connected dot */}
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#c4f036",
                  boxShadow: "0 0 6px rgba(196,240,54,0.6)",
                  animation: "livePulse 2s ease-in-out infinite",
                }} />
                <span style={{ fontSize: 10, color: "#c4f036", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700 }}>
                  Connected
                </span>
              </div>
            </div>

            {/* stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {p.stats.map((s) => (
                <div key={s.label} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--z-border)",
                  borderRadius: 8,
                  padding: "6px 8px",
                  textAlign: "center",
                }}>
                  <div style={{
                    fontSize: 14, fontWeight: 800,
                    color: "var(--z-fg)",
                    fontFamily: "Space Grotesk, sans-serif",
                  }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            {/* action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {p.actions.map((a) => (
                <button
                  key={a.label}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 8,
                    border: a.primary ? "none" : `1px solid var(--z-border)`,
                    background: a.primary ? "#c4f036" : "transparent",
                    color: a.primary ? "#000" : "var(--z-muted)",
                    fontSize: 11,
                    fontWeight: a.primary ? 800 : 600,
                    fontFamily: "Space Grotesk, sans-serif",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s",
                    boxShadow: a.primary ? "0 0 12px rgba(196,240,54,0.3)" : "none",
                  }}
                  onMouseEnter={e => {
                    if (a.primary) {
                      e.currentTarget.style.boxShadow = "0 0 20px rgba(196,240,54,0.5)";
                    } else {
                      e.currentTarget.style.borderColor = p.color;
                      e.currentTarget.style.color = p.color;
                    }
                  }}
                  onMouseLeave={e => {
                    if (a.primary) {
                      e.currentTarget.style.boxShadow = "0 0 12px rgba(196,240,54,0.3)";
                    } else {
                      e.currentTarget.style.borderColor = "var(--z-border)";
                      e.currentTarget.style.color = "var(--z-muted)";
                    }
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {/* footer */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderTop: "1px solid var(--z-border)", paddingTop: 8,
            }}>
              <span style={{ fontSize: 10, color: "var(--z-muted)", fontFamily: "Space Grotesk, sans-serif" }}>
                Last post: {p.lastActivity}
              </span>
              {p.pending && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: p.color,
                  fontFamily: "Space Grotesk, sans-serif",
                  background: `${p.color}15`,
                  border: `1px solid ${p.color}33`,
                  borderRadius: 5,
                  padding: "2px 7px",
                }}>
                  {p.pending}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

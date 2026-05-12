"use client";

import type { CSSProperties } from "react";
import type { FamilyWorkspaceTab } from "./_content";

const FONT = "'Inter', system-ui, sans-serif";
const NUMFONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const GREEN = "#b4ff00";

function formatBalance(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
  return amount < 0 ? `-${formatted}` : formatted;
}

const HUB_CSS = `
  @keyframes familyHubBreathe {
    0%,100%{ transform:scale(1); box-shadow:0 0 28px rgba(153,0,255,.22),0 0 48px rgba(180,255,0,.08),inset 0 0 20px rgba(153,0,255,.1); }
    50%{ transform:scale(1.03); box-shadow:0 0 40px rgba(153,0,255,.32),0 0 72px rgba(180,255,0,.12),inset 0 0 28px rgba(153,0,255,.16); }
  }
  @keyframes familyDotBlink { 0%,100%{opacity:1;} 50%{opacity:.25;} }
  @keyframes famFloat0 { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-7px)} }
  @keyframes famFloat1 { 0%,100%{transform:translate(-50%,-50%) translateY(-4px)} 50%{transform:translate(-50%,-50%) translateY(5px)} }
  @keyframes famFloat2 { 0%,100%{transform:translate(-50%,-50%) translateY(3px)} 50%{transform:translate(-50%,-50%) translateY(-6px)} }
  @keyframes famFloat3 { 0%,100%{transform:translate(-50%,-50%) translateY(-5px)} 50%{transform:translate(-50%,-50%) translateY(4px)} }
  @keyframes famFloat4 { 0%,100%{transform:translate(-50%,-50%) translateY(2px)} 50%{transform:translate(-50%,-50%) translateY(-7px)} }
  @keyframes famFloat5 { 0%,100%{transform:translate(-50%,-50%) translateY(-3px)} 50%{transform:translate(-50%,-50%) translateY(6px)} }
`;

export const FAMILY_HUB_MODULES: {
  id: FamilyWorkspaceTab;
  label: string;
  sub: string;
  num: string;
  color: string;
  color2?: string;
  leftPct: number;
  topPct: number;
  dotEdge: "top" | "bottom" | "left" | "right";
  float: "famFloat0" | "famFloat1" | "famFloat2" | "famFloat3" | "famFloat4" | "famFloat5";
}[] = [
  { id: "overview",  label: "Overview",  sub: "Students & account",     num: "01", color: "#22d3ee", color2: "#0ea5e9", leftPct: 50, topPct: 14, dotEdge: "bottom", float: "famFloat0" },
  { id: "teachers",  label: "Teachers",  sub: "Meet the team",          num: "02", color: "#00e5cc", color2: "#22d3ee", leftPct: 82, topPct: 30, dotEdge: "left",   float: "famFloat1" },
  { id: "billing",   label: "Billing",   sub: "Plans & ledger",         num: "03", color: "#f59e0b", color2: "#ef4444", leftPct: 82, topPct: 70, dotEdge: "left",   float: "famFloat2" },
  { id: "timeline",  label: "Timeline",  sub: "Activity stream",        num: "04", color: GREEN,     color2: "#22c55e", leftPct: 50, topPct: 86, dotEdge: "top",    float: "famFloat3" },
  { id: "documents", label: "Documents", sub: "Files & uploads",        num: "05", color: "#a78bfa", color2: "#9900ff", leftPct: 18, topPct: 70, dotEdge: "right",  float: "famFloat4" },
  { id: "notes",     label: "Notes",     sub: "Internal log",           num: "06", color: "#ff00cc", color2: "#9900ff", leftPct: 18, topPct: 30, dotEdge: "right",  float: "famFloat5" },
];

function connectorStyle(dotEdge: (typeof FAMILY_HUB_MODULES)[number]["dotEdge"], color: string): CSSProperties {
  const base: CSSProperties = {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: "50%",
    zIndex: 10,
    background: color,
    boxShadow: `0 0 8px ${color}, 0 0 16px ${color}55`,
    border: "1.5px solid rgba(255,255,255,0.28)",
  };
  switch (dotEdge) {
    case "bottom":
      return { ...base, bottom: -3, left: "50%", transform: "translateX(-50%)" };
    case "top":
      return { ...base, top: -3, left: "50%", transform: "translateX(-50%)" };
    case "left":
      return { ...base, left: -3, top: "50%", transform: "translateY(-50%)" };
    case "right":
      return { ...base, right: -3, top: "50%", transform: "translateY(-50%)" };
  }
}

function FamilyModuleCard({
  mod,
  active,
  brandColor,
  onSelect,
}: {
  mod: (typeof FAMILY_HUB_MODULES)[number];
  active: boolean;
  brandColor: string;
  onSelect: (originRect: DOMRect) => void;
}) {
  const idx = FAMILY_HUB_MODULES.indexOf(mod);
  return (
    <button
      type="button"
      onClick={(e) => onSelect(e.currentTarget.getBoundingClientRect())}
      aria-current={active ? "true" : undefined}
      className="light-theme:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
      style={{
        position: "absolute",
        left: `${mod.leftPct}%`,
        top: `${mod.topPct}%`,
        transform: "translate(-50%, -50%)",
        width: "min(260px, 28vw)",
        minWidth: 168,
        maxWidth: 280,
        animation: `${mod.float} ${3.4 + idx * 0.22}s ease-in-out infinite`,
        zIndex: 30,
        cursor: "pointer",
        padding: 0,
        border: "none",
        background: "transparent",
        textAlign: "left",
      }}
    >
      <div style={connectorStyle(mod.dotEdge, mod.color)} />
      <div
        style={{
          background: "linear-gradient(135deg, rgba(22,22,22,.96) 0%, rgba(6,6,6,.99) 100%)",
          backdropFilter: "blur(14px)",
          border: active
            ? `1px solid ${brandColor}66`
            : "1px solid rgba(255,255,255,.07)",
          borderRadius: 12,
          boxShadow: active
            ? `0 0 40px ${brandColor}33, 0 16px 44px rgba(0,0,0,.82), inset 0 1px 0 rgba(255,255,255,.08)`
            : `0 0 22px ${mod.color}12, 0 12px 32px rgba(0,0,0,.72), inset 0 1px 0 rgba(255,255,255,.04)`,
          transition: "all 220ms ease",
          overflow: "hidden",
        }}
        className="light-theme:border-[var(--z-border)] light-theme:bg-[color-mix(in_oklab,var(--z-surface),#0a0a0a_4%)] light-theme:shadow-md"
      >
        <div
          style={{
            height: 2,
            background: `linear-gradient(90deg, transparent, ${mod.color}70, ${mod.color2 ?? mod.color}45, transparent)`,
          }}
        />
        <div style={{ padding: "8px 12px 9px", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span
            style={{
              fontFamily: NUMFONT,
              fontSize: 16,
              fontWeight: 600,
              color: mod.color,
              lineHeight: 1,
              flexShrink: 0,
              textShadow: `0 0 10px ${mod.color}88`,
              letterSpacing: "-.01em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {mod.num}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 600,
                color: "#eeeef8",
                letterSpacing: ".06em",
                textTransform: "uppercase",
                lineHeight: 1.1,
              }}
              className="light-theme:text-[var(--z-fg)]"
            >
              {mod.label}
            </div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 7.5,
                color: "rgba(255,255,255,.32)",
                letterSpacing: ".03em",
                marginTop: 3,
              }}
              className="light-theme:text-[var(--z-muted)]"
            >
              {mod.sub}
            </div>
          </div>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: mod.color,
              boxShadow: `0 0 6px ${mod.color}`,
              animation: "familyDotBlink 2.2s ease-in-out infinite",
              flexShrink: 0,
              marginTop: 2,
            }}
          />
        </div>
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${mod.color}18, transparent)` }} />
        <div
          style={{
            padding: "7px 12px 8px",
            fontFamily: FONT,
            fontSize: 9,
            color: active ? GREEN : "rgba(255,255,255,.22)",
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}
          className={active ? "" : "light-theme:text-[var(--z-muted)]"}
        >
          {active ? "● Active" : "Open"}
        </div>
      </div>
    </button>
  );
}

export function FamilyHubCanvas({
  displayName,
  initialsStr,
  shortId,
  status,
  balance,
  locationShort,
  isMilitary,
  locChip,
  avatarBg,
  avatarFg,
  accent,
  brandColor,
  activeTab,
  onSelectTab,
}: {
  displayName: string;
  initialsStr: string;
  shortId: string;
  status: string | null;
  balance: number;
  locationShort: string | null;
  isMilitary: boolean;
  locChip: { text: string; bg: string; fg: string } | null;
  avatarBg: string;
  avatarFg: string;
  accent: string;
  brandColor: string;
  activeTab: FamilyWorkspaceTab | null;
  onSelectTab: (t: FamilyWorkspaceTab, originRect: DOMRect) => void;
}) {
  const balLabel = balance > 0 ? "Due" : balance < 0 ? "Credit" : "Balance";

  return (
    <div className="relative w-full">
      <style dangerouslySetInnerHTML={{ __html: HUB_CSS }} />

      {/* Desktop / tablet orbit */}
      <div
        className="relative mx-auto hidden min-h-[min(560px,78svh)] w-full max-w-[920px] md:block"
        style={{ fontFamily: FONT }}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full text-[length:unset]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          {FAMILY_HUB_MODULES.map((m) => (
            <line
              key={m.id}
              x1={50}
              y1={50}
              x2={m.leftPct}
              y2={m.topPct}
              stroke="rgba(180,255,0,0.14)"
              strokeWidth={0.28}
              opacity={0.55}
            />
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="relative flex flex-col items-center justify-center rounded-full border border-white/[0.08] light-theme:border-[var(--z-border)]"
            style={{
              width: "min(200px, 22vw)",
              height: "min(200px, 22vw)",
              minWidth: 148,
              minHeight: 148,
              maxWidth: 220,
              maxHeight: 220,
              background: [
                "radial-gradient(circle at 40% 35%, rgba(180,255,0,0.12), transparent 55%)",
                `radial-gradient(80% 70% at 80% 80%, ${accent}22, transparent 50%)`,
                "linear-gradient(165deg, rgba(14,14,18,0.98), rgba(4,4,8,0.99))",
              ].join(", "),
              boxShadow: `0 0 0 1px rgba(255,255,255,0.05) inset, 0 24px 80px rgba(0,0,0,0.55), 0 0 60px ${accent}18`,
              animation: "familyHubBreathe 5s ease-in-out infinite",
            }}
          >
            <div
              className="pointer-events-none absolute inset-2 rounded-full border border-white/[0.06]"
              style={{ borderColor: `${avatarFg}33` }}
              aria-hidden
            />
            <div
              className="flex h-[38%] max-h-[88px] min-h-[56px] w-[38%] max-w-[88px] min-w-[56px] items-center justify-center rounded-2xl text-[clamp(1.1rem,3.2vw,1.75rem)] font-black tracking-tight"
              style={{
                background: `linear-gradient(145deg, ${avatarBg.replace("0.07", "0.5")}, ${avatarBg})`,
                color: avatarFg,
                border: `2px solid ${avatarFg}44`,
                boxShadow: `0 0 24px ${avatarFg}33`,
              }}
            >
              {initialsStr}
            </div>
            <p className="mt-2 max-w-[90%] truncate px-2 text-center text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--z-muted)]">
              Command source
            </p>
            <p className="mt-1 max-w-[95%] truncate px-2 text-center text-[clamp(0.8rem,2vw,1rem)] font-bold leading-tight text-[var(--z-fg)]">
              {displayName}
            </p>
            <p className="mt-1 font-mono text-[9px] text-[var(--z-muted)] tabular-nums">{shortId}</p>
          </div>
        </div>

        <nav aria-label="Family workspace modules" className="absolute inset-0">
          {FAMILY_HUB_MODULES.map((mod) => (
            <FamilyModuleCard
              key={mod.id}
              mod={mod}
              active={activeTab === mod.id}
              brandColor={brandColor}
              onSelect={(r) => onSelectTab(mod.id, r)}
            />
          ))}
        </nav>
      </div>

      {/* Mobile: stack hub + card grid */}
      <div className="flex flex-col gap-5 md:hidden">
        <div
          className="mx-auto flex w-full max-w-md flex-col items-center rounded-[1.75rem] border border-[var(--z-border)] px-6 py-7"
          style={{
            background: [
              "radial-gradient(circle at 70% 20%, rgba(180,255,0,0.08), transparent 45%)",
              `radial-gradient(90% 60% at 0% 100%, ${accent}18, transparent 55%)`,
              "var(--z-surface)",
            ].join(", "),
            boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
          }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black"
            style={{
              background: `linear-gradient(145deg, ${avatarBg.replace("0.07", "0.45")}, ${avatarBg})`,
              color: avatarFg,
              border: `2px solid ${avatarFg}44`,
            }}
          >
            {initialsStr}
          </div>
          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--z-muted)]">Family hub</p>
          <p className="mt-1 text-center text-lg font-bold leading-snug text-[var(--z-fg)]">{displayName}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {locationShort && locChip && (
              <span
                className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ borderColor: `${locChip.fg}44`, background: locChip.bg, color: locChip.fg }}
              >
                {locationShort}
              </span>
            )}
            {isMilitary && (
              <span className="rounded-full border border-[color-mix(in_oklab,var(--z-purple),transparent_55%)] bg-[color-mix(in_oklab,var(--z-purple),transparent_88%)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--z-purple)]">
                Military
              </span>
            )}
            <span className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--z-muted)]">
              {status ?? "—"}
            </span>
          </div>
          <p className="mt-4 font-mono text-sm font-bold tabular-nums text-[var(--z-fg)]">
            <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">{balLabel}</span>
            {formatBalance(balance)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {FAMILY_HUB_MODULES.map((mod) => {
            const active = activeTab === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={(e) => onSelectTab(mod.id, e.currentTarget.getBoundingClientRect())}
                aria-current={active ? "true" : undefined}
                className="rounded-xl border px-3 py-3 text-left transition hover:opacity-95"
                style={{
                  borderColor: active ? `${brandColor}55` : "var(--z-border)",
                  background: active ? `color-mix(in oklab, ${brandColor}, transparent 92%)` : "var(--z-surface)",
                  boxShadow: active ? `0 0 0 1px ${brandColor}33` : undefined,
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: mod.color }}>
                  {mod.num} · {mod.label}
                </p>
                <p className="mt-1 text-[11px] text-[var(--z-muted)]">{mod.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop status strip under orbit (compact meta) */}
      <div className="mt-6 hidden flex-wrap items-center justify-center gap-3 text-[12px] md:flex">
        {locationShort && locChip && (
          <span
            className="rounded-full border px-3 py-1 font-semibold"
            style={{ borderColor: `${locChip.fg}44`, background: locChip.bg, color: locChip.fg }}
          >
            {locationShort}
          </span>
        )}
        {isMilitary && (
          <span className="rounded-full border border-[color-mix(in_oklab,var(--z-purple),transparent_55%)] bg-[color-mix(in_oklab,var(--z-purple),transparent_88%)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--z-purple)]">
            Military
          </span>
        )}
        <span className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-1 font-semibold uppercase tracking-wide text-[var(--z-muted)]">
          {status ?? "Unknown"}
        </span>
        <span className="font-mono text-[var(--z-fg-secondary,#a1a1aa)] tabular-nums">
          <span className="mr-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">{balLabel}</span>
          {formatBalance(balance)}
        </span>
      </div>
    </div>
  );
}

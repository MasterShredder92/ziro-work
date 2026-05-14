"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House } from "lucide-react";
import { useZiroWorkspace } from "@/components/workspace/ZiroWorkspaceContext";
import type { ShellLocation } from "@/lib/workspace/getWorkspaceShellData";
import { cn } from "@/components/ui/utils";

const FONT = "'Inter', system-ui, sans-serif";
const GREEN = "#b4ff00";

function LocationOrb({
  loc,
  active,
  onClick,
}: {
  loc: ShellLocation & { id: string };
  active: boolean;
  onClick: () => void;
}) {
  const [imgErr, setImgErr] = React.useState(false);
  const showImg = loc.logoUrl && !imgErr;
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div style={{ position: "relative", width: 52, height: 52 }}>
        {active ? (
          <div
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              border: `1.5px solid ${GREEN}`,
              animation: "zwLocPulse 2.4s ease-out infinite",
            }}
          />
        ) : null}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: `2px solid ${active ? `${GREEN}70` : "rgba(255,255,255,.08)"}`,
            overflow: "hidden",
            background: showImg ? "#000" : "rgba(180,255,0,.06)",
            boxShadow: active ? `0 0 16px rgba(180,255,0,.28)` : "0 4px 14px rgba(0,0,0,.6)",
            transition: "all 280ms ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {showImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={loc.logoUrl!}
              alt={loc.name}
              onError={() => setImgErr(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{
                fontFamily: FONT,
                fontSize: 10,
                fontWeight: 800,
                color: active ? GREEN : "#3a3a44",
              }}
            >
              {loc.shortName.slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>
      </div>
      <span
        style={{
          fontFamily: FONT,
          fontSize: "0.72rem",
          fontWeight: 500,
          color: active ? GREEN : "rgba(255,255,255,.75)",
          letterSpacing: ".03em",
          textAlign: "center",
          maxWidth: 70,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          transition: "color 280ms ease",
        }}
      >
        {loc.shortName}
      </span>
      <style>{`
        @keyframes zwLocPulse { 0%{transform:scale(1);opacity:1;} 40%,100%{transform:scale(1.7);opacity:0;} }
      `}</style>
    </div>
  );
}

export function AppLocationRail() {
  const pathname = usePathname() ?? "";
  const onDashboard = pathname === "/dashboard";
  const { schoolName, locations, selectedLocId, setSelectedLocId } = useZiroWorkspace();
  const allLoc: ShellLocation = {
    id: "all",
    name: schoolName,
    shortName: "All",
    logoUrl: "/brand/zirowork-bolt-icon.png",
  };
  /** Schedule is per-location only (four separate studio calendars). */
  const scheduleMode = pathname.startsWith("/schedule");
  const orbLocations: ShellLocation[] = scheduleMode ? locations : [allLoc, ...locations];

  return (
    <aside
      style={{
        width: 88,
        flexShrink: 0,
        backgroundColor: "var(--z-bg)",
        borderRight: "1px solid var(--z-border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 0",
        zIndex: 50,
        position: "relative",
      }}
      aria-label="Workspace"
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
          <Link
            href="/dashboard"
            title="Dashboard"
            aria-label="Dashboard"
            aria-current={onDashboard ? "page" : undefined}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/45 transition hover:border-white/20 hover:text-white/80",
              onDashboard && "border-[#b4ff00]/45 text-[#b4ff00]",
            )}
            style={{ textDecoration: "none" }}
          >
            <House className="h-[15px] w-[15px]" strokeWidth={2} aria-hidden />
          </Link>
          <span
            style={{
              fontFamily: FONT,
              fontSize: 7,
              fontWeight: 500,
              color: onDashboard ? "rgba(180,255,0,.55)" : "rgba(255,255,255,.22)",
              letterSpacing: ".12em",
              textTransform: "uppercase",
            }}
          >
            Home
          </span>
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 6.5,
            fontWeight: 600,
            letterSpacing: ".22em",
            color: "rgba(180,255,0,.35)",
            textTransform: "uppercase",
          }}
        >
          Locs
        </div>
        {orbLocations.map((loc) => (
          <LocationOrb
            key={loc.id}
            loc={loc}
            active={selectedLocId === (loc.id === "all" ? null : loc.id)}
            onClick={() => setSelectedLocId(loc.id === "all" ? null : loc.id)}
          />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
        <Link
          href="/settings"
          title="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[15px] text-white/40 transition hover:border-white/20 hover:text-white/70"
          style={{
            textDecoration: "none",
          }}
        >
          ⚙
        </Link>
        <span
          style={{
            fontFamily: FONT,
            fontSize: 7,
            fontWeight: 500,
            color: "rgba(255,255,255,.22)",
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}
        >
          Config
        </span>
      </div>
    </aside>
  );
}

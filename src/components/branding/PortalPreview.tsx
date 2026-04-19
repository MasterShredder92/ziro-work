"use client";

import type { BrandingPreviewDevice } from "./previewDevice";
import { BrandingPreviewDeviceFrame } from "./BrandingPreviewDeviceFrame";
import { PORTAL_PREVIEW_SAMPLE } from "./portalPreviewSample";

export interface PortalPreviewProps {
  device: BrandingPreviewDevice;
  /** Workspace display name from draft (not PII from APIs). */
  tenantName: string;
}

const BORDER_SOFT =
  "var(--brand-card-border, rgba(255, 255, 255, 0.08))";

export function PortalPreview({ device, tenantName }: PortalPreviewProps) {
  const s = PORTAL_PREVIEW_SAMPLE;
  const stacked = device === "phone";

  return (
    <BrandingPreviewDeviceFrame device={device}>
      <div
        data-branding-preview
        className="flex min-h-[22rem] flex-col overflow-hidden rounded-[var(--brand-card-radius,1rem)] border text-left"
        style={{
          background: "var(--brand-background)",
          color: "var(--brand-nav-fg, rgba(255,255,255,0.92))",
          borderColor: "var(--brand-card-border, rgba(255,255,255,0.08))",
          fontFamily: "var(--brand-font-body, system-ui, sans-serif)",
          fontSize: "var(--brand-font-base-size, 16px)",
          lineHeight: "var(--brand-font-line-height, 1.5)",
        }}
      >
        <header
          className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2.5"
          style={{
            background: "var(--brand-nav-bg, var(--brand-surface))",
            borderColor: "var(--brand-card-border, rgba(255,255,255,0.08))",
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--brand-button-radius,0.5rem)] text-xs font-bold"
              style={{
                background: "var(--brand-primary)",
                color: "var(--brand-background)",
              }}
            >
              {tenantName.trim().charAt(0).toUpperCase() || "Z"}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold" style={{ fontFamily: "var(--brand-font-heading, inherit)" }}>
                {tenantName || "Your studio"}
              </div>
              <div className="truncate text-[10px] opacity-70">{s.portalLabel}</div>
            </div>
          </div>
          <span
            className="shrink-0 rounded px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: "var(--brand-surface)",
              color: "var(--brand-accent)",
            }}
          >
            Sample data
          </span>
        </header>

        <div
          className={`flex min-h-0 flex-1 ${stacked ? "flex-col" : "flex-row"}`}
        >
          <aside
            className={`shrink-0 border-[var(--brand-card-border,rgba(255,255,255,0.08))] ${
              stacked
                ? "flex flex-row gap-1 overflow-x-auto border-b px-2 py-2"
                : "w-[11rem] border-r px-2 py-3"
            }`}
            style={{
              background:
                "var(--brand-sidebar-bg, var(--brand-surface))",
            }}
          >
            <nav
              className={`flex gap-1 ${stacked ? "flex-row" : "flex-col"}`}
              aria-label="Sample navigation"
            >
              {s.nav.map((item, i) => (
                <button
                  key={item}
                  type="button"
                  className={`whitespace-nowrap rounded-[var(--brand-button-radius,0.5rem)] px-2 py-1.5 text-left text-[11px] font-medium transition ${
                    i === 0 ? "" : "opacity-80 hover:opacity-100"
                  }`}
                  style={
                    i === 0
                      ? {
                          background: "var(--brand-primary)",
                          color: "var(--brand-background)",
                        }
                      : {
                          background: "transparent",
                          color: "inherit",
                        }
                  }
                >
                  {item}
                </button>
              ))}
            </nav>
            {!stacked ? (
              <div
                className="mt-4 border-t border-solid pt-3"
                style={{ borderTopColor: BORDER_SOFT }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                  Family
                </div>
                <div className="mt-1 text-xs font-medium">{s.family.primary}</div>
                <ul className="mt-2 space-y-1.5 text-[11px] opacity-85">
                  {s.family.students.map((st) => (
                    <li key={st.name}>
                      <span className="font-medium">{st.name}</span>
                      <span className="opacity-60"> · {st.role}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[10px] leading-snug opacity-55">
                  {s.teacherPortalNote}{" "}
                  <span className="block pt-1">{s.studentPortalNote}</span>
                </p>
              </div>
            ) : null}
          </aside>

          <main className="min-w-0 flex-1 space-y-3 p-3">
            <div
              className="rounded-[var(--brand-card-radius,1rem)] border p-3"
              style={{
                background: "var(--brand-surface)",
                borderColor: "var(--brand-card-border, rgba(255,255,255,0.08))",
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--brand-accent)" }}
              >
                Upcoming lesson
              </div>
              <div
                className="mt-1 text-sm font-semibold"
                style={{
                  color: "var(--brand-primary)",
                  fontFamily: "var(--brand-font-heading, inherit)",
                }}
              >
                {s.upcomingLesson.title}
              </div>
              <div className="mt-1 text-[11px] opacity-75">
                {s.upcomingLesson.when} · {s.upcomingLesson.duration}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div
                className="rounded-[var(--brand-card-radius,1rem)] border p-2.5"
                style={{
                  background: "var(--brand-surface)",
                  borderColor: "var(--brand-card-border, rgba(255,255,255,0.08))",
                }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                  Teacher
                </div>
                <div className="mt-0.5 text-sm font-medium">{s.teacher.name}</div>
                <div className="text-[11px] opacity-70">{s.teacher.title}</div>
              </div>
              <div
                className="rounded-[var(--brand-card-radius,1rem)] border p-2.5"
                style={{
                  background: "var(--brand-surface)",
                  borderColor: "var(--brand-card-border, rgba(255,255,255,0.08))",
                }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                  Location
                </div>
                <div className="mt-0.5 text-sm font-medium">{s.location.name}</div>
                <div className="text-[11px] opacity-70">{s.location.detail}</div>
              </div>
            </div>

            <div
              className="rounded-[var(--brand-card-radius,1rem)] border p-3"
              style={{
                background: "var(--brand-surface)",
                borderColor: "var(--brand-card-border, rgba(255,255,255,0.08))",
              }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                Next steps
              </div>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[12px]">
                {s.nextSteps.map((step) => (
                  <li key={step.id} className="opacity-90">
                    {step.text}
                  </li>
                ))}
              </ol>
            </div>
          </main>
        </div>
      </div>
    </BrandingPreviewDeviceFrame>
  );
}

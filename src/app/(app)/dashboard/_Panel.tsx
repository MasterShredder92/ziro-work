import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  accentColor?: string;
  className?: string;
  /** When true, renders an animated gradient border around the panel */
  featured?: boolean;
};

export function Panel({ title, description, children, accentColor = "#00ff88", className = "", featured = false }: PanelProps) {
  const inner = (
    <div
      className={`flex flex-col gap-4 rounded-2xl p-5 ${className}`}
      style={{
        background: "linear-gradient(160deg, #131315 0%, #111113 100%)",
        border: featured ? "none" : "1px solid rgba(255,255,255,0.07)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)`,
        borderLeft: featured ? "none" : `3px solid ${accentColor}`,
        borderRadius: featured ? "13px" : undefined,
      }}
    >
      <div>
        <div className="flex items-center gap-2">
          {/* Accent dot */}
          <div
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
          />
          <h2
            className="text-[0.6rem] font-bold uppercase tracking-[0.22em]"
            style={{ color: accentColor }}
          >
            {title}
          </h2>
        </div>
        {description ? (
          <p className="mt-1 text-[11px] leading-relaxed pl-3.5" style={{ color: "var(--z-muted)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );

  if (featured) {
    return (
      <div
        className="rounded-2xl p-px"
        style={{
          background: `linear-gradient(135deg, ${accentColor}55, rgba(255,255,255,0.08) 40%, ${accentColor}22 100%)`,
          boxShadow: `0 0 40px ${accentColor}18, 0 8px 32px rgba(0,0,0,0.35)`,
        }}
      >
        {inner}
      </div>
    );
  }

  return inner;
}

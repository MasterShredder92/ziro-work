import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
  accentColor?: string;
  className?: string;
};

export function Panel({ title, description, children, accentColor = "#00ff88", className = "" }: PanelProps) {
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl p-5 ${className}`}
      style={{
        background: "#111113",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)`,
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <div>
        <h2
          className="text-[0.6rem] font-bold uppercase tracking-[0.22em]"
          style={{ color: accentColor }}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-[11px] leading-relaxed" style={{ color: "var(--z-muted)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

"use client";

export type TourSpotlightProps = {
  /** Viewport-space circle center and radius in CSS pixels */
  cx: number;
  cy: number;
  r: number;
  onBackdropClick?: () => void;
};

export function TourSpotlight({ cx, cy, r, onBackdropClick }: TourSpotlightProps) {
  const mask = `radial-gradient(circle ${r}px at ${cx}px ${cy}px, transparent 98%, black 100%)`;

  return (
    <>
      <button
        type="button"
        aria-hidden="true"
        className="fixed inset-0 z-[70] cursor-default border-0 bg-transparent p-0"
        style={{
          backgroundColor: "rgba(6, 6, 8, 0.82)",
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
        onClick={onBackdropClick}
      />
      <div
        className="pointer-events-none fixed z-[71] rounded-full border-2 border-[var(--z-accent)] shadow-[0_0_24px_color-mix(in_oklab,var(--z-accent),transparent_55%)]"
        style={{
          width: r * 2 + 12,
          height: r * 2 + 12,
          left: cx - r - 6,
          top: cy - r - 6,
        }}
      />
    </>
  );
}

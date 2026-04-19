export type BrandingPreviewDevice = "desktop" | "tablet" | "phone";

export const BRANDING_PREVIEW_DEVICES: readonly BrandingPreviewDevice[] = [
  "desktop",
  "tablet",
  "phone",
] as const;

/** Frame outer width; preview stays scrollable inside. */
export function previewFrameDimensions(device: BrandingPreviewDevice): {
  width: string;
  maxWidth: string;
} {
  switch (device) {
    case "tablet":
      return { width: "768px", maxWidth: "100%" };
    case "phone":
      return { width: "390px", maxWidth: "100%" };
    default:
      return { width: "100%", maxWidth: "1280px" };
  }
}

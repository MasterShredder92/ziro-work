export const BRANDING_PREVIEW_DEVICES = [
    "desktop",
    "tablet",
    "phone",
];
/** Frame outer width; preview stays scrollable inside. */
export function previewFrameDimensions(device) {
    switch (device) {
        case "tablet":
            return { width: "768px", maxWidth: "100%" };
        case "phone":
            return { width: "390px", maxWidth: "100%" };
        default:
            return { width: "100%", maxWidth: "1280px" };
    }
}

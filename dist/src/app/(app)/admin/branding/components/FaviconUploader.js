"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { LogoUploader } from "./LogoUploader";
const SIZE_HINT = {
    favicon: "32×32 PNG/SVG — browser tab icon",
    icon192: "192×192 PNG — PWA home screen",
    icon512: "512×512 PNG — PWA splash",
    touch: "180×180 PNG — Apple touch icon",
};
export function FaviconUploader({ label, value, onChange, disabled, size = "favicon", }) {
    return (_jsx(LogoUploader, { label: label !== null && label !== void 0 ? label : "Favicon", value: value, onChange: onChange, disabled: disabled, backgroundStyle: "dark", accept: "image/png,image/svg+xml,image/x-icon,image/webp", description: SIZE_HINT[size] }));
}

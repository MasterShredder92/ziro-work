"use client";

import { LogoUploader } from "./LogoUploader";

export interface FaviconUploaderProps {
  label?: string;
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
  size?: "favicon" | "icon192" | "icon512" | "touch";
}

const SIZE_HINT: Record<NonNullable<FaviconUploaderProps["size"]>, string> = {
  favicon: "32×32 PNG/SVG — browser tab icon",
  icon192: "192×192 PNG — PWA home screen",
  icon512: "512×512 PNG — PWA splash",
  touch: "180×180 PNG — Apple touch icon",
};

export function FaviconUploader({
  label,
  value,
  onChange,
  disabled,
  size = "favicon",
}: FaviconUploaderProps) {
  return (
    <LogoUploader
      label={label ?? "Favicon"}
      value={value}
      onChange={onChange}
      disabled={disabled}
      backgroundStyle="dark"
      accept="image/png,image/svg+xml,image/x-icon,image/webp"
      description={SIZE_HINT[size]}
    />
  );
}

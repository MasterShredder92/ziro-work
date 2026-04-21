"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { previewFrameDimensions } from "./previewDevice";
/** Outer chrome + scroll region shared by theme and portal mock previews (Task 19). */
export function BrandingPreviewDeviceFrame({ device, children, }) {
    const { width, maxWidth } = previewFrameDimensions(device);
    return (_jsx("div", { className: "flex w-full justify-center", children: _jsx("div", { className: "box-border flex flex-col overflow-hidden rounded-[8px] border border-[var(--z-border,#2a2a2e)] bg-[var(--z-surface-2,#101012)] shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-[width,max-width] duration-300 ease-out", style: { width, maxWidth }, children: _jsx("div", { className: "max-h-[min(70vh,560px)] min-h-0 overflow-y-auto overflow-x-hidden", children: children }) }) }));
}

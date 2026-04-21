"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrandingPreviewDeviceFrame } from "./BrandingPreviewDeviceFrame";
import { PORTAL_PREVIEW_SAMPLE } from "./portalPreviewSample";
const BORDER_SOFT = "var(--brand-card-border, rgba(255, 255, 255, 0.08))";
export function PortalPreview({ device, tenantName }) {
    const s = PORTAL_PREVIEW_SAMPLE;
    const stacked = device === "phone";
    return (_jsx(BrandingPreviewDeviceFrame, { device: device, children: _jsxs("div", { "data-branding-preview": true, className: "flex min-h-[22rem] flex-col overflow-hidden rounded-[var(--brand-card-radius,1rem)] border text-left", style: {
                background: "var(--brand-background)",
                color: "var(--brand-nav-fg, rgba(255,255,255,0.92))",
                borderColor: "var(--brand-card-border, rgba(255,255,255,0.08))",
                fontFamily: "var(--brand-font-body, system-ui, sans-serif)",
                fontSize: "var(--brand-font-base-size, 16px)",
                lineHeight: "var(--brand-font-line-height, 1.5)",
            }, children: [_jsxs("header", { className: "flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2.5", style: {
                        background: "var(--brand-nav-bg, var(--brand-surface))",
                        borderColor: "var(--brand-card-border, rgba(255,255,255,0.08))",
                    }, children: [_jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [_jsx("span", { className: "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--brand-button-radius,0.5rem)] text-xs font-bold", style: {
                                        background: "var(--brand-primary)",
                                        color: "var(--brand-background)",
                                    }, children: tenantName.trim().charAt(0).toUpperCase() || "Z" }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-sm font-semibold", style: { fontFamily: "var(--brand-font-heading, inherit)" }, children: tenantName || "Your studio" }), _jsx("div", { className: "truncate text-[10px] opacity-70", children: s.portalLabel })] })] }), _jsx("span", { className: "shrink-0 rounded px-2 py-0.5 text-[10px] font-medium", style: {
                                background: "var(--brand-surface)",
                                color: "var(--brand-accent)",
                            }, children: "Sample data" })] }), _jsxs("div", { className: `flex min-h-0 flex-1 ${stacked ? "flex-col" : "flex-row"}`, children: [_jsxs("aside", { className: `shrink-0 border-[var(--brand-card-border,rgba(255,255,255,0.08))] ${stacked
                                ? "flex flex-row gap-1 overflow-x-auto border-b px-2 py-2"
                                : "w-[11rem] border-r px-2 py-3"}`, style: {
                                background: "var(--brand-sidebar-bg, var(--brand-surface))",
                            }, children: [_jsx("nav", { className: `flex gap-1 ${stacked ? "flex-row" : "flex-col"}`, "aria-label": "Sample navigation", children: s.nav.map((item, i) => (_jsx("button", { type: "button", className: `whitespace-nowrap rounded-[var(--brand-button-radius,0.5rem)] px-2 py-1.5 text-left text-[11px] font-medium transition ${i === 0 ? "" : "opacity-80 hover:opacity-100"}`, style: i === 0
                                            ? {
                                                background: "var(--brand-primary)",
                                                color: "var(--brand-background)",
                                            }
                                            : {
                                                background: "transparent",
                                                color: "inherit",
                                            }, children: item }, item))) }), !stacked ? (_jsxs("div", { className: "mt-4 border-t border-solid pt-3", style: { borderTopColor: BORDER_SOFT }, children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider opacity-50", children: "Family" }), _jsx("div", { className: "mt-1 text-xs font-medium", children: s.family.primary }), _jsx("ul", { className: "mt-2 space-y-1.5 text-[11px] opacity-85", children: s.family.students.map((st) => (_jsxs("li", { children: [_jsx("span", { className: "font-medium", children: st.name }), _jsxs("span", { className: "opacity-60", children: [" \u00B7 ", st.role] })] }, st.name))) }), _jsxs("p", { className: "mt-3 text-[10px] leading-snug opacity-55", children: [s.teacherPortalNote, " ", _jsx("span", { className: "block pt-1", children: s.studentPortalNote })] })] })) : null] }), _jsxs("main", { className: "min-w-0 flex-1 space-y-3 p-3", children: [_jsxs("div", { className: "rounded-[var(--brand-card-radius,1rem)] border p-3", style: {
                                        background: "var(--brand-surface)",
                                        borderColor: "var(--brand-card-border, rgba(255,255,255,0.08))",
                                    }, children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider", style: { color: "var(--brand-accent)" }, children: "Upcoming lesson" }), _jsx("div", { className: "mt-1 text-sm font-semibold", style: {
                                                color: "var(--brand-primary)",
                                                fontFamily: "var(--brand-font-heading, inherit)",
                                            }, children: s.upcomingLesson.title }), _jsxs("div", { className: "mt-1 text-[11px] opacity-75", children: [s.upcomingLesson.when, " \u00B7 ", s.upcomingLesson.duration] })] }), _jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-[var(--brand-card-radius,1rem)] border p-2.5", style: {
                                                background: "var(--brand-surface)",
                                                borderColor: "var(--brand-card-border, rgba(255,255,255,0.08))",
                                            }, children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider opacity-50", children: "Teacher" }), _jsx("div", { className: "mt-0.5 text-sm font-medium", children: s.teacher.name }), _jsx("div", { className: "text-[11px] opacity-70", children: s.teacher.title })] }), _jsxs("div", { className: "rounded-[var(--brand-card-radius,1rem)] border p-2.5", style: {
                                                background: "var(--brand-surface)",
                                                borderColor: "var(--brand-card-border, rgba(255,255,255,0.08))",
                                            }, children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider opacity-50", children: "Location" }), _jsx("div", { className: "mt-0.5 text-sm font-medium", children: s.location.name }), _jsx("div", { className: "text-[11px] opacity-70", children: s.location.detail })] })] }), _jsxs("div", { className: "rounded-[var(--brand-card-radius,1rem)] border p-3", style: {
                                        background: "var(--brand-surface)",
                                        borderColor: "var(--brand-card-border, rgba(255,255,255,0.08))",
                                    }, children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-wider opacity-50", children: "Next steps" }), _jsx("ol", { className: "mt-2 list-decimal space-y-1.5 pl-4 text-[12px]", children: s.nextSteps.map((step) => (_jsx("li", { className: "opacity-90", children: step.text }, step.id))) })] })] })] })] }) }));
}

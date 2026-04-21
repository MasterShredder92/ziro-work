import { jsx as _jsx } from "react/jsx-runtime";
export default function OgPreviewLayout({ children }) {
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-[var(--z-bg)] px-[var(--z-space-5)] py-[var(--z-space-8)] text-[var(--z-fg)]", children: children }));
}

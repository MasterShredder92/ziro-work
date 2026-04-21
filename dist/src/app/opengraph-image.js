import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ImageResponse } from "next/og";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
    return new ImageResponse((_jsxs("div", { style: {
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: 64,
            background: "#080808",
            color: "#d4d4d4",
            fontFamily: "ui-sans-serif, system-ui",
        }, children: [_jsx("div", { style: { fontSize: 28, letterSpacing: "0.2em", color: "#00ff88", fontWeight: 800 }, children: "ZIROWORK" }), _jsx("div", { style: { marginTop: 24, fontSize: 56, fontWeight: 700, lineHeight: 1.05 }, children: "Charcoal console." }), _jsx("div", { style: { marginTop: 12, fontSize: 56, fontWeight: 700, lineHeight: 1.05, color: "#00ff88" }, children: "Neon signal." })] })), size);
}

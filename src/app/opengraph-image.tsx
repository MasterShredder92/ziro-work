import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background: "#080808",
          color: "#d4d4d4",
          fontFamily: "ui-sans-serif, system-ui",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: "0.2em", color: "#c4f036", fontWeight: 800 }}>ZIROWORK</div>
        <div style={{ marginTop: 24, fontSize: 56, fontWeight: 700, lineHeight: 1.05 }}>Charcoal console.</div>
        <div style={{ marginTop: 12, fontSize: 56, fontWeight: 700, lineHeight: 1.05, color: "#c4f036" }}>
          Neon signal.
        </div>
      </div>
    ),
    size,
  );
}

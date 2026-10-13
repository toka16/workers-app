import { ImageResponse } from "next/og";

// Default share image for pages without their own (worker profiles use a portfolio photo).
// Colors are the hero/accent tokens from globals.css; only Latin text, so no font file is needed.
export const alt = "Xelosani";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          background: "linear-gradient(135deg, #003735 0%, #005b54 100%)",
          color: "white",
        }}
      >
        <div style={{ width: 96, height: 12, borderRadius: 6, background: "#fc9a10", marginBottom: 40 }} />
        <div style={{ fontSize: 140, fontWeight: 700, letterSpacing: -2 }}>Xelosani</div>
      </div>
    ),
    size,
  );
}

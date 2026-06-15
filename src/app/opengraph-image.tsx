import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "OneSky: many traditions, one sky";

/** The default social share image, used wherever a page has none of its own. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0e0b12 0%, #161229 55%, #2c2750 100%)",
          color: "#f3eee7",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "radial-gradient(circle, #f3d9a8 0%, #d4b072 55%, transparent 75%)",
            marginBottom: 36,
          }}
        />
        <div style={{ fontSize: 40, letterSpacing: 18, fontWeight: 600 }}>ONESKY</div>
        <div style={{ fontSize: 56, fontWeight: 600, marginTop: 16 }}>Many traditions. One sky.</div>
        <div style={{ fontSize: 28, color: "#b6acba", marginTop: 18, maxWidth: 820, textAlign: "center" }}>
          Your birth moment read across every tradition, and where they agree.
        </div>
      </div>
    ),
    { ...size },
  );
}

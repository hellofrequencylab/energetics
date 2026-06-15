import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The iOS home-screen icon (apple-touch-icon), generated as a PNG. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#161229",
        }}
      >
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: "50%",
            background: "radial-gradient(circle, #f3d9a8 0%, #d4b072 58%, #161229 100%)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}

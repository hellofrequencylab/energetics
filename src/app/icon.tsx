import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** The favicon / app icon: the glowing convergence node on twilight. */
export default function Icon() {
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
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "radial-gradient(circle, #f3d9a8 0%, #d4b072 55%, #161229 100%)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}

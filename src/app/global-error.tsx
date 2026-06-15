"use client";

/**
 * Root error boundary: catches failures in the root layout itself, so it must
 * render its own <html>/<body>. Inline styles only (globals.css is not guaranteed
 * to be applied here).
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0e0b12",
          color: "#f3eee7",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ marginTop: 8, color: "#b6acba", maxWidth: 360 }}>
          OneSky hit an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: 24,
            background: "#ecb885",
            color: "#1c1830",
            border: "none",
            borderRadius: 10,
            padding: "10px 18px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}

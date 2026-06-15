import type { MetadataRoute } from "next";

/**
 * Web app manifest, so OneSky installs to the home screen and runs standalone.
 * The convergence mark ships as an SVG (scales to any size, doubles as maskable);
 * iOS uses the PNG apple-icon route. Theme and background match the twilight base.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OneSky",
    short_name: "OneSky",
    description: "Your birth moment read across many traditions, with the overlap shown honestly.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e0b12",
    theme_color: "#161229",
    categories: ["lifestyle", "reference"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}

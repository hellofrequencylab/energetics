/**
 * Shared colors for SVG/canvas drawing (the convergence map, the strength bars,
 * the arcs, the diagrams). These mirror the CSS tokens in globals.css but are
 * plain strings because SVG attributes and canvas cannot read CSS variables in
 * every context we draw in. Keep them in sync with the tokens.
 *
 * For DOM styling use the Tailwind token utilities (text-accent, bg-surface, ...),
 * not these constants.
 */
export const GOLD = "#d4b072"; // --accent
export const VIOLET = "#8b7dff"; // --accent-2
export const INK = "#0e0b12"; // --background
export const NODE_GLOW = "#f3d9a8"; // --node-glow
export const THREAD = "#4a4358"; // muted graph hairline

/** Independence groups, colored by what each system reads from. */
export const GROUP_COLOR: Record<string, string> = {
  ephemeris: "#6aa0cf", // the sky
  date: GOLD, // the calendar
  name: VIOLET, // your name
};

/**
 * Browser-only helpers for turning a rendered SVG chart into a downloadable PNG.
 * Plain module, no React, no new dependencies. Safe to import anywhere that runs
 * in the browser (call it from a client component or an event handler).
 */

// The app's dark ink. The chart SVG is transparent, so we paint this behind it
// before exporting or the PNG would be unreadable on a light backdrop.
const BACKGROUND_INK = "#0e0b12";

/** Read the rendered pixel size, falling back to the viewBox when it is zero. */
function readSvgSize(svg: SVGSVGElement): { width: number; height: number } {
  const rect = svg.getBoundingClientRect();
  let width = rect.width;
  let height = rect.height;

  if (width === 0 || height === 0) {
    const viewBox = svg.viewBox?.baseVal;
    if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
      width = viewBox.width;
      height = viewBox.height;
    }
  }

  return { width, height };
}

/** Trigger a browser download for a blob under the given filename. */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Serialize an SVG element and download it as a PNG. The canvas is sized at
 * `scale` times the SVG's rendered size for a crisp export, and filled with the
 * app's dark ink first so the transparent artwork stays readable.
 *
 * Errors are handled gracefully: if the 2D context is unavailable or the canvas
 * becomes tainted, this resolves without throwing so the caller does not crash.
 */
export async function downloadSvgAsPng(
  svg: SVGSVGElement,
  filename: string,
  scale: number = 2,
): Promise<void> {
  const { width, height } = readSvgSize(svg);
  if (width === 0 || height === 0) return;

  const serialized = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const context = canvas.getContext("2d");
    if (!context) return;

    // Paint the dark ink, then draw the artwork on top at full canvas size.
    context.fillStyle = BACKGROUND_INK;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas);
    if (!blob) return;

    triggerDownload(blob, filename);
  } catch {
    // Swallow load or taint failures so a failed export never crashes the page.
    return;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

/** Load an image from a URL, resolving once it is ready and rejecting on error. */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the SVG image."));
    image.src = url;
  });
}

/** Convert a canvas to a PNG blob, resolving null if the canvas is tainted. */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    } catch {
      resolve(null);
    }
  });
}

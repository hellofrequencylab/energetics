import { MAYA_COLOR, ToneNumeral } from "./shared";

/**
 * A Dreamspell galactic signature: the galactic tone as a bar-and-dot numeral
 * above the solar seal, in one of the four directional colors. Original
 * schematic. Dreamspell is a modern reconstruction, kept out of the synthesis.
 */
export function GalacticSignature({
  color,
  seal,
  tone,
  toneName,
}: {
  color: string;
  seal: string;
  tone: number;
  toneName: string;
}) {
  const swatch = MAYA_COLOR[color] ?? "#8a89a0";
  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <div style={{ color: swatch }}>
        <ToneNumeral tone={tone} unit={8} />
      </div>
      <div className="text-xs text-muted">
        {toneName} (tone {tone})
      </div>
      <div
        className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2"
        style={{ borderColor: swatch, backgroundColor: `${swatch}1f` }}
      >
        <span className="text-lg font-semibold text-foreground">{seal}</span>
        <span className="text-xs" style={{ color: swatch }}>
          {color}
        </span>
      </div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted">Solar seal</div>
    </div>
  );
}

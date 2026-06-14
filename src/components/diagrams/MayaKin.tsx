import { ToneNumeral } from "./shared";

/**
 * A Tzolk'in kin: the galactic tone as a Maya bar-and-dot numeral above the day
 * sign, drawn as a labeled cartouche (the day sign name in the K'iche' and
 * Yucatec forms). Original schematic, not a reproduction of any carved glyph.
 */
export function MayaKin({
  daySign,
  kiche,
  tone,
}: {
  daySign: string;
  kiche: string;
  tone: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <div className="text-accent">
        <ToneNumeral tone={tone} unit={8} />
      </div>
      <div className="text-xs text-muted">Tone {tone}</div>
      <div className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2 border-accent/60 bg-accent/10">
        <span className="text-lg font-semibold text-foreground">{daySign}</span>
        {kiche && kiche !== daySign && <span className="text-xs text-muted">{kiche}</span>}
      </div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted">Day sign</div>
    </div>
  );
}

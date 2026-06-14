import type { ComputedSystem } from "@/lib/synthesis/types";
import { vedicToWheel, westernToWheel } from "@/lib/wheel";
import { ChartWheel } from "@/components/ChartWheel";
import { BodyGraph } from "./BodyGraph";
import { FourPillars, type Pillars } from "./FourPillars";
import { MayaKin } from "./MayaKin";
import { GalacticSignature } from "./GalacticSignature";
import { TarotCards } from "./TarotCards";
import { LifePath } from "./LifePath";
import { DiagramFrame } from "./shared";

/**
 * Per-system illustration. Each tradition is drawn in its own traditional form
 * from the computed native data: the bodygraph for Human Design, the four pillars
 * for BaZi, the kin for the Maya count, and so on. Returns null for systems
 * without a diagram yet, so the per-system card simply shows its factors.
 */
export function SystemDiagram({ computation }: { computation: ComputedSystem }) {
  const f = computation.native.factors;
  const val = <T,>(key: string): T | undefined => f[key]?.value as T | undefined;

  switch (computation.meta.id) {
    case "western-tropical": {
      const wheel = westernToWheel(computation.native);
      if (!wheel) return null;
      return (
        <DiagramFrame title="Chart wheel · Tropical">
          <div className="w-full max-w-sm">
            <ChartWheel data={wheel} />
            {!wheel.cusps && (
              <p className="mt-1 text-center text-xs text-muted">
                Add a birth time and place for houses and the Ascendant.
              </p>
            )}
          </div>
        </DiagramFrame>
      );
    }
    case "vedic-jyotish": {
      const wheel = vedicToWheel(computation.native);
      if (!wheel) return null;
      return (
        <DiagramFrame title="Chart wheel · Sidereal">
          <div className="w-full max-w-sm">
            <ChartWheel data={wheel} />
          </div>
        </DiagramFrame>
      );
    }
    case "human-design": {
      const centers = val<Record<string, boolean>>("centers");
      if (!centers) return null;
      return (
        <DiagramFrame title="Bodygraph">
          <BodyGraph centers={centers} channels={val<string[]>("channels") ?? []} />
        </DiagramFrame>
      );
    }
    case "chinese-bazi": {
      const pillars = val<Pillars>("pillars");
      if (!pillars) return null;
      return (
        <DiagramFrame title="Four pillars">
          <FourPillars pillars={pillars} />
        </DiagramFrame>
      );
    }
    case "tzolkin": {
      const ds = val<{ daySign: string; kiche: string }>("day-sign");
      const tone = val<number>("tone");
      if (!ds || tone == null) return null;
      return (
        <DiagramFrame title="Tzolk'in kin">
          <MayaKin daySign={ds.daySign} kiche={ds.kiche} tone={tone} />
        </DiagramFrame>
      );
    }
    case "dreamspell": {
      const seal = val<string>("seal");
      const tone = val<number>("tone");
      if (!seal || tone == null) return null;
      // The seal factor display is "Color Seal"; recover the color from the kin.
      const sealName = String(f.seal?.value ?? seal);
      const colorMatch = /^(Red|White|Blue|Yellow)\s+(.+)$/.exec(String(f.seal?.display ?? ""));
      const color = colorMatch?.[1] ?? "Yellow";
      const name = colorMatch?.[2] ?? sealName;
      const toneName = /^\d+\s+(.+)$/.exec(String(f.tone?.display ?? ""))?.[1] ?? "";
      return (
        <DiagramFrame title="Galactic signature">
          <GalacticSignature color={color} seal={name} tone={tone} toneName={toneName} />
        </DiagramFrame>
      );
    }
    case "tarot-birth-cards": {
      const personality = val<{ card: string; number: number }>("personality");
      const soul = val<{ card: string; number: number }>("soul");
      if (!personality || !soul) return null;
      return (
        <DiagramFrame title="Birth cards">
          <TarotCards personality={personality} soul={soul} />
        </DiagramFrame>
      );
    }
    case "numerology-pythagorean": {
      const lifePath = val<number>("life-path");
      if (lifePath == null) return null;
      return (
        <DiagramFrame title="Life path">
          <LifePath value={lifePath} />
        </DiagramFrame>
      );
    }
    default:
      return null;
  }
}

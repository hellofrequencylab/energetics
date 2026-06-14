import type { Lineage } from "@/lib/core/contracts";
import { FRAMING, LINEAGE_NOTE, SYSTEM_NOTE } from "@/lib/ethics";

export interface EthicsSystem {
  id: string;
  displayName: string;
  lineage: Lineage;
}

const LINEAGE_LABEL: Record<Lineage, string> = {
  traditional: "Traditional",
  "modern-reconstruction": "Modern reconstruction",
  hybrid: "Hybrid",
};

const LINEAGE_ORDER: Lineage[] = ["traditional", "hybrid", "modern-reconstruction"];

/** Shared lineage-honesty panel, reused on results and the About page. */
export function EthicsPanel({ systems }: { systems: EthicsSystem[] }) {
  const byLineage = LINEAGE_ORDER.map((lineage) => ({
    lineage,
    items: systems.filter((s) => s.lineage === lineage),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5 text-sm">
      <ul className="space-y-1.5 text-muted">
        {FRAMING.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-accent">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {byLineage.map((group) => (
        <div key={group.lineage}>
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
            {LINEAGE_LABEL[group.lineage]}
          </h4>
          <p className="mb-2 text-xs text-muted">{LINEAGE_NOTE[group.lineage]}</p>
          <ul className="space-y-1.5">
            {group.items.map((s) => (
              <li key={s.id} className="text-foreground/90">
                <span className="font-medium">{s.displayName}</span>
                {SYSTEM_NOTE[s.id] && <span className="text-muted">: {SYSTEM_NOTE[s.id]}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

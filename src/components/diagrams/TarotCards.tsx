/**
 * Tarot birth cards: the personality and soul Major Arcana, each drawn as a card
 * in the traditional upright proportions with its Roman numeral and name. The art
 * is an original schematic emblem (a simple motif keyed to the card number), not a
 * reproduction of any published deck.
 */

interface Card {
  card: string;
  number: number;
}

const ROMAN = [
  "0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI",
];

function CardFace({ card, label }: { card: Card; label: string }) {
  const numeral = ROMAN[card.number] ?? String(card.number);
  // A simple emblem: rays whose count echoes the card number, purely decorative.
  const rays = Math.max(4, (card.number % 8) + 4);
  return (
    <figure className="flex flex-col items-center gap-1.5">
      <svg width={108} height={168} viewBox="0 0 108 168" role="img" aria-label={card.card}>
        <rect x={2} y={2} width={104} height={164} rx={10} fill="#1c1830" stroke="#c9a24a" strokeWidth={1.5} />
        <rect x={9} y={9} width={90} height={150} rx={6} fill="none" stroke="#c9a24a" strokeOpacity={0.4} />
        <text x={54} y={30} textAnchor="middle" fontSize={15} fill="#c9a24a" fontWeight={600}>
          {numeral}
        </text>
        {/* Original emblem: a ring of short rays around a center. */}
        <g transform="translate(54 88)">
          <circle r={16} fill="none" stroke="#c9a24a" strokeOpacity={0.8} />
          <circle r={3} fill="#c9a24a" />
          {Array.from({ length: rays }).map((_, i) => {
            const a = (i / rays) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={Math.cos(a) * 22}
                y1={Math.sin(a) * 22}
                x2={Math.cos(a) * 30}
                y2={Math.sin(a) * 30}
                stroke="#c9a24a"
                strokeOpacity={0.7}
              />
            );
          })}
        </g>
        <text x={54} y={150} textAnchor="middle" fontSize={9} fill="#ede9f2">
          {card.card}
        </text>
      </svg>
      <figcaption className="text-[10px] uppercase tracking-[0.2em] text-muted">{label}</figcaption>
    </figure>
  );
}

export function TarotCards({ personality, soul }: { personality: Card; soul: Card }) {
  const samesame = personality.number === soul.number;
  return (
    <div className="flex items-start justify-center gap-4">
      <CardFace card={personality} label="Personality" />
      {!samesame && <CardFace card={soul} label="Soul" />}
    </div>
  );
}

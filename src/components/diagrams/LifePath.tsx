/**
 * Numerology as a medallion: a core number shown large and plainly. Used for the
 * Pythagorean Life Path and the Chaldean Name Number. Master numbers (11, 22, 33)
 * are noted, since they are not reduced further.
 */
const MASTERS = new Set([11, 22, 33]);

export function LifePath({ value, label = "LIFE PATH" }: { value: number; label?: string }) {
  const master = MASTERS.has(value);
  return (
    <svg width={150} height={150} viewBox="0 0 150 150" role="img" aria-label={`${label} ${value}`}>
      <circle cx={75} cy={75} r={62} fill="none" stroke="#c9a24a" strokeOpacity={0.35} />
      <circle cx={75} cy={75} r={52} fill="#c9a24a" fillOpacity={0.1} stroke="#c9a24a" strokeOpacity={0.7} />
      <text x={75} y={30} textAnchor="middle" fontSize={9} fill="#8a89a0" style={{ letterSpacing: "0.2em" }}>
        {label}
      </text>
      <text x={75} y={92} textAnchor="middle" fontSize={52} fill="#ede9f2" fontWeight={600}>
        {value}
      </text>
      {master && (
        <text x={75} y={120} textAnchor="middle" fontSize={9} fill="#c9a24a" style={{ letterSpacing: "0.15em" }}>
          MASTER NUMBER
        </text>
      )}
    </svg>
  );
}

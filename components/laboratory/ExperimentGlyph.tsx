/**
 * Hairline glyphs for the laboratory's landing page: each is the shape of its
 * experiment, drawn from the same mathematics, not an illustration of it.
 */

const W = 120;
const H = 72;

function sinePath(amplitude: number, k: number, phase: number, n = 60): string {
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = (i / n) * W;
    const y = H / 2 - amplitude * Math.sin((k * x * 2 * Math.PI) / W + phase);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function sumPath(n = 60): string {
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = (i / n) * W;
    const y =
      H / 2 -
      (11 * Math.sin((2 * x * 2 * Math.PI) / W) + 11 * Math.sin((3 * x * 2 * Math.PI) / W + 0.6));
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function ellipse(rx: number, ry: number): string {
  return `M${W / 2 + rx},${H / 2} A${rx},${ry} 0 1,0 ${W / 2 - rx},${H / 2} A${rx},${ry} 0 1,0 ${W / 2 + rx},${H / 2}`;
}

export function ExperimentGlyph({ slug, className = "" }: { slug: string; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      role="presentation"
      className={`h-auto w-full ${className}`}
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {slug === "wave-superposition" ? (
          <>
            <line x1="0" y1={H / 2} x2={W} y2={H / 2} strokeWidth="0.6" opacity="0.25" />
            <path d={sinePath(11, 2, 0)} strokeWidth="0.7" opacity="0.35" />
            <path d={sinePath(11, 3, 0.6)} strokeWidth="0.7" opacity="0.35" />
            <path d={sumPath()} strokeWidth="1.1" />
          </>
        ) : slug === "gradient-descent" ? (
          <>
            {[[54, 30], [40, 22], [27, 15], [15, 8]].map(([rx, ry]) => (
              <path key={rx} d={ellipse(rx, ry)} strokeWidth="0.6" opacity="0.35" />
            ))}
            {/* The descent: large steps that shrink geometrically towards the centre. */}
            <path
              d="M10,16 L34,45.4 L48.4,31 L55.6,38.3 L58.5,34.6 L59.4,36.2 L60,36"
              strokeWidth="1"
            />
            <circle cx="10" cy="16" r="1.6" fill="currentColor" stroke="none" />
            <circle cx="60" cy="36" r="1.4" fill="currentColor" stroke="none" />
          </>
        ) : (
          <>
            <line x1="8" y1="64" x2={W - 4} y2="64" strokeWidth="0.6" opacity="0.4" />
            <line x1="8" y1="64" x2="8" y2="6" strokeWidth="0.6" opacity="0.4" />
            <path
              d={Array.from({ length: 61 }, (_, i) => {
                const x = 8 + (i / 60) * (W - 16);
                const y = 64 - 54 * Math.exp(-((i / 60) * 4.2));
                return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(" ")}
              strokeWidth="1.1"
            />
            {/* The first half-life, marked. */}
            <line x1="25.2" y1="64" x2="25.2" y2="37" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.6" />
            <line x1="8" y1="37" x2="25.2" y2="37" strokeWidth="0.6" strokeDasharray="2 2" opacity="0.6" />
          </>
        )}
      </g>
    </svg>
  );
}

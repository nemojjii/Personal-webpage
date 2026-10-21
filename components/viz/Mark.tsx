/**
 * The wave-vector star: N directions evenly spaced over a half turn, the
 * generating set of the interference field drawn on the homepage.
 * A static SVG, safe to use anywhere, including in print.
 */
export function Mark({
  waves = 5,
  size = 44,
  className = "",
}: {
  waves?: number;
  size?: number;
  className?: string;
}) {
  const r = 20;
  const rays = Array.from({ length: waves }, (_, j) => {
    const theta = (Math.PI * j) / waves;
    return {
      x1: 24 - Math.cos(theta) * r,
      y1: 24 - Math.sin(theta) * r,
      x2: 24 + Math.cos(theta) * r,
      y2: 24 + Math.sin(theta) * r,
    };
  });

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      role="presentation"
    >
      <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
      {rays.map((ray, i) => (
        <line
          key={i}
          x1={ray.x1}
          y1={ray.y1}
          x2={ray.x2}
          y2={ray.y2}
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.75"
        />
      ))}
      <circle cx="24" cy="24" r="1.1" fill="currentColor" />
    </svg>
  );
}

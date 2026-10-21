/**
 * The interference mark: two sources, the straight nodal line between them,
 * and the first pair of nodal hyperbolas either side. The same geometry the
 * homepage field is drawn from, reduced to its skeleton.
 * A static SVG, safe anywhere, including in print.
 */
export function Mark({
  size = 44,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      role="presentation"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.7">
        <circle cx="24" cy="24" r="20" opacity="0.3" />
        {/* The central nodal line, and the first hyperbola on each side. */}
        <line x1="24" y1="5" x2="24" y2="43" opacity="0.8" />
        <path d="M11 7 C 17.5 16, 17.5 32, 11 41" opacity="0.5" />
        <path d="M37 7 C 30.5 16, 30.5 32, 37 41" opacity="0.5" />
      </g>
      {/* The two sources. */}
      <circle cx="17" cy="24" r="1.15" fill="currentColor" />
      <circle cx="31" cy="24" r="1.15" fill="currentColor" />
    </svg>
  );
}

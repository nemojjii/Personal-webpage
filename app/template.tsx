/**
 * Wraps every page so that a navigation produces one short cross-fade.
 * CSS-only and opacity-only — see app/globals.css.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}

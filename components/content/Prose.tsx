import type { ReactNode } from "react";

/**
 * Long-form typography wrapper. All MDX bodies are rendered inside this.
 * `.prose` is defined once, in app/globals.css.
 */
export function Prose({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`prose ${className}`}>{children}</div>;
}

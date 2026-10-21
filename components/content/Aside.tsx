import type { ReactNode } from "react";

/**
 * A short note set apart from the argument — the folded-in equivalent of a
 * margin note. It stays inside the reading measure so that it never collides
 * with the table of contents in the right margin.
 *
 *   <Aside>Gauss wrote this to Bessel in 1811.</Aside>
 */
export function Aside({ children }: { children: ReactNode }) {
  return (
    <aside className="my-7 border-l border-accent-soft/60 py-1 pl-4 font-sans text-[0.8125rem] leading-[1.7] text-ink-soft [&>*]:!my-0 [&>*+*]:!mt-2">
      {children}
    </aside>
  );
}

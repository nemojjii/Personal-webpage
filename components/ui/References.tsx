import type { ReactNode } from "react";

/**
 * Renders *asterisk emphasis* inside an otherwise plain citation line, so
 * titles can be italicised without running the whole bibliography through MDX.
 */
function emphasise(text: string): ReactNode[] {
  return text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith("*") && part.endsWith("*") && part.length > 2 ? (
      <em key={i}>{part.slice(1, -1)}</em>
    ) : (
      part
    ),
  );
}

/**
 * A hand-written bibliography. Lines come from the `references:` list in
 * frontmatter, in whatever citation style you prefer.
 */
export function References({ items }: { items: readonly string[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-16 print-avoid-break" aria-labelledby="references">
      <h2 id="references" className="label border-b border-rule pb-2.5">
        References
      </h2>
      <ol className="mt-5 flex flex-col gap-y-3">
        {items.map((item, i) => (
          <li
            key={i}
            className="grid grid-cols-[1.75rem_1fr] font-sans text-[0.875rem] leading-[1.65] text-ink-soft"
          >
            <span className="text-ink-muted tnum">[{i + 1}]</span>
            <span className="[text-wrap:pretty]">{emphasise(item)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

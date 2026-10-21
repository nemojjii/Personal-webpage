import type { ReactNode } from "react";

/**
 * A responsive figure with a caption.
 *
 *   <Figure caption="A phase portrait." number="1">
 *     <img src="/figures/phase.svg" alt="Phase portrait" />
 *   </Figure>
 *
 * Pass `wide` to let the figure break out of the reading measure on
 * large screens. Inline SVG children work exactly as well as images.
 */
export function Figure({
  children,
  caption,
  number,
  wide = false,
  alt,
  src,
}: {
  children?: ReactNode;
  caption?: ReactNode;
  number?: string | number;
  wide?: boolean;
  alt?: string;
  src?: string;
}) {
  return (
    <figure
      className={`my-10 print-avoid-break ${
        wide ? "lg:-mx-12" : ""
      }`}
    >
      <div className="overflow-x-auto border border-rule-soft bg-surface/60 p-4 sm:p-6 [&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:max-w-full">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt ?? ""} className="mx-auto block h-auto max-w-full" />
        ) : (
          children
        )}
      </div>
      {caption ? (
        <figcaption className="mt-3 font-sans text-[0.8125rem] leading-relaxed text-ink-soft">
          {number ? (
            <span className="mr-2 font-medium tracking-wide text-ink">
              Fig. {number}
            </span>
          ) : null}
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

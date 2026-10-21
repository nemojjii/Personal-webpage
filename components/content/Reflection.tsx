import type { ReactNode } from "react";

/**
 * A titled container for the reflections a book or film page may one day
 * hold. These exist so the writing has a place to go; a page without them
 * simply has no such section. Use them in an entry's MDX body:
 *
 *   <StayedWithMe>
 *     Prose, with everything MDX allows.
 *   </StayedWithMe>
 */
export function Reflection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      aria-label={title}
      className="!mt-14 border-t border-rule pt-8 [&>*+*]:!mt-[1.35em] [&>h2]:!mt-0 [&>h2]:!text-[1.35em]"
    >
      <h2>{title}</h2>
      {children}
    </section>
  );
}

/** The Bookshelf's reflection section. */
export const StayedWithMe = ({ children }: { children: ReactNode }) => (
  <Reflection title="What Stayed With Me">{children}</Reflection>
);

/** The Screening Room: cinematography, colour, composition, editing, sound. */
export const OnForm = ({ children }: { children: ReactNode }) => (
  <Reflection title="On Form">{children}</Reflection>
);

/** The Screening Room: character, relationships, identity, moral ambiguity. */
export const OnPeople = ({ children }: { children: ReactNode }) => (
  <Reflection title="On People">{children}</Reflection>
);

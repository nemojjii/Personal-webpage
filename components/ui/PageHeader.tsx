import type { ReactNode } from "react";

/**
 * The masthead of every index page: eyebrow label, title, standfirst.
 */
export function PageHeader({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: ReactNode;
  title: string;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-rule pb-8 sm:pb-10">
      {eyebrow ? <p className="label mb-4">{eyebrow}</p> : null}
      <h1 className="font-serif text-display leading-[1.06] tracking-[-0.015em]">{title}</h1>
      {intro ? (
        <div className="mt-5 max-w-[34rem] font-serif text-[1.125rem] leading-[1.65] text-ink-soft sm:text-[1.1875rem]">
          {intro}
        </div>
      ) : null}
      {children ? <div className="mt-7">{children}</div> : null}
    </header>
  );
}

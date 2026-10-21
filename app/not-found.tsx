import Link from "next/link";

import { Mark } from "@/components/viz/Mark";
import { navigation } from "@/site.config";

export default function NotFound() {
  return (
    <div className="shell py-24 sm:py-32">
      <div className="mx-auto max-w-[34rem]">
        <Mark className="text-accent" size={48} />
        <p className="label mt-8">404</p>
        <h1 className="mt-4 font-serif text-display leading-[1.08] tracking-[-0.015em]">
          This page does not exist.
        </h1>
        <p className="mt-5 font-serif text-[1.125rem] leading-relaxed text-ink-soft">
          The address may be mistyped, or the entry may have been renamed. The
          sections below are all still here.
        </p>
        <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2.5">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="link-quiet font-sans text-[0.8125rem] text-ink">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

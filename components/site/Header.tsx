"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { navigation, secondaryNavigation, site } from "@/site.config";

const allLinks = [...navigation, ...secondaryNavigation];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();

  // The menu is remembered as "open at this path", so navigating anywhere
  // closes it without an effect that writes state after the fact.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = (next: boolean) => setOpenedAt(next ? pathname : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenedAt(null);
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`no-print fixed inset-x-0 top-0 z-50 h-[var(--nav-h)] bg-paper/92 backdrop-blur-[2px] transition-[border-color] duration-500 ${
        scrolled || open ? "border-b border-rule" : "border-b border-transparent"
      }`}
    >
      <div className="shell flex h-full items-center justify-between gap-6">
        <Link
          href="/"
          className="group shrink-0 font-serif text-[1.0625rem] leading-none tracking-[0.01em] text-ink"
        >
          {site.name}
          <span className="sr-only"> — home</span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-x-7">
            {navigation.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative block py-1 font-sans text-[0.8125rem] transition-colors duration-200 ${
                      active ? "text-accent" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={`absolute -bottom-0.5 left-0 right-0 h-px origin-left bg-accent transition-transform duration-[420ms] ease-[cubic-bezier(.22,.61,.36,1)] ${
                        active ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </Link>
                </li>
              );
            })}
            <li aria-hidden="true" className="h-3.5 w-px bg-rule" />
            {secondaryNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className={`block py-1 font-sans text-[0.8125rem] transition-colors duration-200 ${
                    isActive(pathname, item.href)
                      ? "text-accent"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="-mr-2 flex items-center gap-2 px-2 py-2 font-sans text-[0.75rem] tracking-[0.12em] uppercase text-ink-soft md:hidden"
        >
          {open ? "Close" : "Menu"}
          <span aria-hidden="true" className="flex h-2.5 w-4 flex-col justify-between">
            <span
              className={`h-px w-full bg-current transition-transform duration-300 ${
                open ? "translate-y-[5px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-full bg-current transition-opacity duration-200 ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`h-px w-full bg-current transition-transform duration-300 ${
                open ? "-translate-y-[5px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile panel */}
      <AnimatePresence>
        {open ? (
          <motion.nav
            id="mobile-navigation"
            aria-label="Primary"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute inset-x-0 top-[var(--nav-h)] max-h-[calc(100dvh-var(--nav-h))] overflow-y-auto border-b border-rule bg-paper md:hidden"
          >
            <ul className="shell flex flex-col py-4">
              {allLinks.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href} className="border-b border-rule-soft last:border-b-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-baseline justify-between py-4 font-serif text-[1.5rem] leading-none ${
                        active ? "text-accent" : "text-ink"
                      }`}
                    >
                      {item.label}
                      {active ? (
                        <span aria-hidden="true" className="font-sans text-[0.625rem] tracking-[0.2em] uppercase">
                          here
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

/**
 * A single top-level nav item that opens a short list of real links rather
 * than navigating directly — a disclosure, not an ARIA menu: the revealed
 * items are plain `<a>`s in normal tab order, which screen readers and
 * keyboard users already know how to work with, rather than a `menuitem`
 * roving-tabindex pattern that is easy to get subtly wrong. Closes on
 * Escape and on a click outside; the caller remounts this component with
 * `key={pathname}` so it also starts closed again after any navigation,
 * rather than reaching for an effect to reset state a prop change already
 * implies.
 */
export function NavDropdown({
  label,
  isHere,
  pathname,
  items,
}: {
  label: string;
  /** Whether this item itself (the trigger) should read as "here". */
  isHere: boolean;
  pathname: string;
  items: readonly { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-current={isHere ? "page" : undefined}
        onClick={() => setOpen((o) => !o)}
        className={`relative flex items-center gap-1 py-1 font-sans text-[0.8125rem] transition-colors duration-200 ${
          isHere ? "text-accent" : "text-ink-soft hover:text-ink"
        }`}
      >
        {label}
        <span
          aria-hidden="true"
          className={`inline-block text-[0.625rem] transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          ▸
        </span>
        <span
          aria-hidden="true"
          className={`absolute -bottom-0.5 left-0 right-0 h-px origin-left bg-accent transition-transform duration-[420ms] ease-[cubic-bezier(.22,.61,.36,1)] ${
            isHere ? "scale-x-100" : "scale-x-0"
          }`}
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute top-full left-0 z-[60] mt-3 min-w-[11rem] border border-rule bg-paper py-1.5"
      >
        <ul>
          {items.map((child) => {
            const childHere =
              pathname === child.href || pathname.startsWith(`${child.href}/`);
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={() => setOpen(false)}
                  aria-current={childHere ? "page" : undefined}
                  className={`block px-4 py-2 font-sans text-[0.8125rem] whitespace-nowrap transition-colors duration-200 ${
                    childHere ? "text-accent" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {child.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

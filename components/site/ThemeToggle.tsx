"use client";

import { useEffect, useRef, useState } from "react";

import { applyTheme, readStoredTheme, THEME_SETTINGS, type ThemeSetting } from "@/lib/theme";

const LABEL: Record<ThemeSetting, string> = { system: "System", light: "Light", dark: "Dark" };

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" {...props}>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1M12.9 3.1l-1.05 1.05M4.15 11.85 3.1 12.9M12.9 12.9l-1.05-1.05M4.15 4.15 3.1 3.1" />
    </svg>
  );
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13.5 9.6A5.6 5.6 0 0 1 6.4 2.5a5.8 5.8 0 1 0 7.1 7.1Z" />
    </svg>
  );
}

function MonitorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1.5" y="2.5" width="13" height="8.5" rx="0.75" />
      <path d="M5.5 14h5M8 11v3" />
    </svg>
  );
}

const ICON: Record<ThemeSetting, (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  system: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon,
};

/**
 * System / Light / Dark, as a button that opens a small menu. The button's
 * own icon always shows the current *setting* (a monitor for "system", not
 * whatever that resolves to), matching common practice elsewhere.
 *
 * The actual page colours are already correct before this ever mounts — set
 * by the blocking script in `app/layout.tsx` — so the only thing `mounted`
 * guards here is this control's own icon and `aria-checked` state, which
 * must start from the same guess on the server and the client (`"system"`)
 * to avoid a hydration mismatch, then correct themselves once this effect
 * runs. That one-frame correction is invisible: it changes which icon this
 * small control shows, never the page.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [setting, setSetting] = useState<ThemeSetting>("system");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    // One-time correction from the SSR-safe "system" guess to whatever is
    // actually in localStorage — can only happen after mount, since the
    // server has no access to it. The page's own colours are already right
    // by now (set by the blocking script in app/layout.tsx); this only
    // corrects which icon this control itself shows.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a browser-only API unavailable during SSR, not deriving state from props
    setSetting(readStoredTheme());
  }, []);

  useEffect(() => {
    if (!open) return;

    const checkedIndex = Math.max(0, THEME_SETTINGS.indexOf(setting));
    itemRefs.current[checkedIndex]?.focus();

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setting]);

  function choose(next: ThemeSetting) {
    setSetting(next);
    applyTheme(next);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    const items = itemRefs.current.filter((el): el is HTMLButtonElement => el !== null);
    if (!items.length) return;
    const from = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(from + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(from - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  const Icon = ICON[setting];

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="theme-menu"
        aria-label={`Theme: ${LABEL[setting]}. Open theme menu`}
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center text-ink-soft transition-colors duration-200 hover:text-ink"
      >
        <Icon aria-hidden="true" className="h-[1.0625rem] w-[1.0625rem]" />
      </button>

      {open ? (
        <div
          ref={menuRef}
          id="theme-menu"
          role="menu"
          aria-label="Theme"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[8.5rem] border border-rule bg-paper py-1 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
        >
          {THEME_SETTINGS.map((s, i) => {
            const ItemIcon = ICON[s];
            const checked = setting === s;
            return (
              <button
                key={s}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                tabIndex={-1}
                onClick={() => choose(s)}
                className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left font-sans text-[0.8125rem] transition-colors duration-150 hover:bg-surface hover:text-ink focus-visible:bg-surface focus-visible:text-ink ${
                  checked ? "text-ink" : "text-ink-soft"
                }`}
              >
                <ItemIcon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                {LABEL[s]}
                <span
                  aria-hidden="true"
                  className={`ml-auto h-1 w-1 rounded-full bg-accent transition-opacity duration-150 ${
                    checked ? "opacity-100" : "opacity-0"
                  }`}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

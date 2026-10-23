"use client";

import type { ReactNode } from "react";

/* The laboratory's few controls, styled from the site's own tokens. */

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => v.toFixed(2),
  unit,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  unit?: string;
}) {
  const text = `${format(value)}${unit ? ` ${unit}` : ""}`;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        {/* Not the site's small-caps label: uppercasing would turn k into K and η into H. */}
        <span className="font-sans text-[0.6875rem] font-medium tracking-[0.06em] text-ink-soft">{label}</span>
        <span className="font-mono text-[0.75rem] text-ink tnum">{text}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={text}
        onChange={(e) => onChange(Number(e.target.value))}
        className="lab-range mt-1 w-full"
      />
    </label>
  );
}

export function LabButton({
  children,
  onClick,
  pressed,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  /** For toggles such as play / pause. */
  pressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={`font-sans text-[0.8125rem] underline underline-offset-[0.25em] transition-colors duration-200
                  hover:text-accent hover:decoration-accent disabled:text-ink-muted disabled:no-underline
                  ${pressed ? "text-accent decoration-accent" : "text-ink decoration-rule"}`}
    >
      {children}
    </button>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 font-sans text-[0.8125rem] text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-accent"
      />
      {label}
    </label>
  );
}

/** The instrument's chassis: a hairline frame on the surface tone. */
export function LabFrame({ children, caption }: { children: ReactNode; caption?: ReactNode }) {
  return (
    <figure>
      <div className="border border-rule-soft bg-surface/40 p-4 sm:p-6">{children}</div>
      {caption ? (
        <figcaption className="mt-3 font-sans text-[0.8125rem] leading-relaxed text-ink-soft">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function Controls({ children }: { children: ReactNode }) {
  return <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export function ButtonRow({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">{children}</div>;
}

export function Readout({ items }: { items: { term: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-rule-soft pt-4 font-sans text-[0.75rem] sm:grid-cols-4">
      {items.map((item, i) => (
        <div key={i}>
          <dt className="text-ink-muted">{item.term}</dt>
          <dd className="tnum text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Legend({
  items,
}: {
  items: { label: ReactNode; color: string; width?: number; dashed?: boolean }[];
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-sans text-[0.75rem] text-ink-soft">
      {items.map((item, i) => (
        <li key={i} className="inline-flex items-center gap-2">
          <svg viewBox="0 0 24 6" width="24" height="6" aria-hidden="true">
            <line
              x1="0"
              y1="3"
              x2="24"
              y2="3"
              stroke={item.color}
              strokeWidth={item.width ?? 1.2}
              strokeDasharray={item.dashed ? "3 2" : undefined}
            />
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** A note set beneath the readout: what the instrument is telling you. */
export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-4 font-sans text-[0.8125rem] leading-relaxed text-ink-soft">{children}</p>;
}

/**
 * A compact expandable section for controls that do not need to be visible
 * at all times — native `<details>`, so opening and closing it is already
 * keyboard-operable and announced to assistive technology without any ARIA
 * of its own.
 */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group mt-6 border-t border-rule-soft pt-5" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center gap-2 font-sans text-[0.75rem] font-medium tracking-[0.04em] text-ink-soft transition-colors duration-200 hover:text-ink">
        <span
          aria-hidden="true"
          className="inline-block text-ink-muted transition-transform duration-200 group-open:rotate-90"
        >
          ▸
        </span>
        {summary}
      </summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}

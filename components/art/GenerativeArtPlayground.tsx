"use client";

import { useId, useState } from "react";

import { ComplexTransform } from "./ComplexTransform";
import { ParametricForms } from "./ParametricForms";
import { VectorField } from "./VectorField";

type Mode = "complex" | "field" | "parametric";

const MODES: { id: Mode; label: string; description: string }[] = [
  {
    id: "complex",
    label: "Complex Transformations",
    description: "A grid on the complex plane, and what z², z³ or 1/z does to it.",
  },
  {
    id: "field",
    label: "Vector Field Drawings",
    description: "Streamlines of a two-dimensional vector field, integrated with Runge–Kutta.",
  },
  {
    id: "parametric",
    label: "Parametric Forms",
    description: "Lissajous figures, rose curves and hypotrochoids, traced from one parameter.",
  },
];

export function GenerativeArtPlayground() {
  const [mode, setMode] = useState<Mode>("complex");
  const id = useId();
  const active = MODES.find((m) => m.id === mode)!;

  return (
    <div>
      <div role="group" aria-label="Artwork mode" className="flex flex-wrap gap-x-7 gap-y-3 border-b border-rule-soft pb-6">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={mode === m.id}
            aria-describedby={`${id}-${m.id}-desc`}
            onClick={() => setMode(m.id)}
            className={`text-left font-serif text-[1.0625rem] leading-snug underline underline-offset-[0.3em] transition-colors duration-200
                        ${mode === m.id ? "text-klein" : "text-ink-soft decoration-rule hover:text-ink"}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      {MODES.map((m) => (
        <p key={m.id} id={`${id}-${m.id}-desc`} className="sr-only">
          {m.description}
        </p>
      ))}

      <p className="mt-4 font-serif text-[1.0625rem] leading-relaxed text-ink-soft italic">
        {active.description}
      </p>

      <div className="mt-8">
        {mode === "complex" ? <ComplexTransform /> : null}
        {mode === "field" ? <VectorField /> : null}
        {mode === "parametric" ? <ParametricForms /> : null}
      </div>
    </div>
  );
}

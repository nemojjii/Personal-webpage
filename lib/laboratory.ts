import type { EntryRef, RelationKind } from "./types";

/**
 * The Little Laboratory's five experiments: what the landing page lists,
 * what the sitemap includes, and the model notes each page sets beneath its
 * instrument. The mathematics itself lives in lib/laboratory/*.ts.
 */

/**
 * An editorial link from an experiment to an entry elsewhere on the site.
 * The reverse direction is derived (lib/content.ts), so each relation is
 * written once, here, with its kind and a sentence saying why.
 */
export interface ExperimentRelation {
  /** "research/<slug>", "projects/<slug>", "books/<slug>" or "films/<slug>". */
  ref: EntryRef;
  kind: RelationKind;
  /** One or two sentences, shown beside the link. Say what the connection is, and what it is not. */
  note: string;
}

export interface Experiment {
  slug: string;
  numeral: "I" | "II" | "III" | "IV" | "V";
  title: string;
  /** The question the instrument lets you put to the model. */
  question: string;
  /** What you can move, and what you will see. For the landing page. */
  description: string;
  href: string;
  /** Short metadata description. */
  summary: string;
  /** MDX: the model, its assumptions, and things worth trying. */
  notes: string;
  /** Hand-written relations to entries. Empty is the honest default. */
  related: ExperimentRelation[];
}

export const experiments: Experiment[] = [
  {
    slug: "wave-superposition",
    numeral: "I",
    title: "Wave Superposition",
    question: "What happens where two waves share one string?",
    description:
      "Two travelling sine waves and their sum, drawn on the same string. Set each amplitude and wavelength and the phase between them, then watch where the displacements reinforce one another and where they cancel.",
    href: "/laboratory/wave-superposition",
    summary:
      "An interactive superposition of two travelling sine waves: amplitudes, wave numbers, relative phase, and the constructive and destructive regions of their sum.",
    notes: String.raw`
## The model

Two sine waves travel along one string. Taking the phase of the first as the
reference, their displacements are

$$
y_1(x,t) = A_1 \sin(k_1 x - \omega_1 t), \qquad
y_2(x,t) = A_2 \sin(k_2 x - \omega_2 t + \Delta\varphi),
$$

and the string, which can only be in one place at a time, shows their sum,
$y = y_1 + y_2$. That is all superposition is: displacements add.

Both waves travel on the same medium at the same speed $v$, so each angular
frequency follows its wave number, $\omega = v\,k$. This is the
non-dispersive case — a taut string, sound in air — and it is an assumption of
the instrument, not a law. The wavelength is $\lambda = 2\pi/k$.

## What to look for

When the two wave numbers are equal, the sum is again a single sine wave, with
amplitude

$$
A = \sqrt{A_1^2 + A_2^2 + 2A_1A_2\cos\Delta\varphi}.
$$

It reaches $A_1 + A_2$ when $\Delta\varphi = 0$ (constructive interference)
and falls to $|A_1 - A_2|$ when $\Delta\varphi = \pi$ (destructive); two equal
waves in opposite phase cancel completely, and the string lies flat. When the
wave numbers differ there is no single amplitude: the sum beats, and the
pattern itself travels.

The highlight shades, at each point and instant, whether the two
displacements pull the same way or opposite ways. It is honest for any pair
of waves, equal wavelength or not.

Units are arbitrary. Nothing here is measured; it is the equations, drawn.
`,
    related: [
      {
        ref: "research/power-spectral-density-eeg-signal-quality",
        kind: "conceptual",
        note: "Fourier analysis treats a recorded signal as a superposition of sinusoids; this instrument shows two of them adding. The EEG work used that analysis on real recordings — it did not study this demonstration.",
      },
    ],
  },
  {
    slug: "gradient-descent",
    numeral: "II",
    title: "Gradient Descent",
    question: "How does a step downhill find the bottom of a bowl?",
    description:
      "A point on a bowl-shaped surface, moved downhill one step at a time against the gradient. Choose where it starts, how steep the bowl is and how large each step is, and see it settle, overshoot, or run away.",
    href: "/laboratory/gradient-descent",
    summary:
      "An interactive gradient descent on a quadratic surface: starting point, learning rate and curvature, with the path, the iteration count and the objective value, and the conditions for convergence, oscillation and divergence.",
    notes: String.raw`
## The model

The surface is a quadratic bowl,

$$
f(x,y) = \tfrac{1}{2}\left(a x^2 + b y^2\right), \qquad a, b > 0,
$$

whose only minimum is at the origin, and whose gradient is
$\nabla f = (a x,\; b y)$. Gradient descent moves against the gradient by a
fixed fraction $\eta$ of its size — the learning rate — at every step:

$$
\mathbf{p}_{n+1} = \mathbf{p}_n - \eta\,\nabla f(\mathbf{p}_n).
$$

## When it works, and when it does not

For this bowl the two coordinates do not interact, and each step simply
multiplies $x$ by $(1 - \eta a)$ and $y$ by $(1 - \eta b)$. So the iteration
converges exactly when both factors are smaller than one in magnitude, that
is, when

$$
\eta < \frac{2}{\max(a, b)}.
$$

If a factor is negative but still smaller than one in size, that coordinate
overshoots the bottom and lands on the other side at each step, shrinking all
the while: oscillation. If a factor reaches one in magnitude the steps stop
shrinking and the point leaves the frame: divergence. A bowl that is much
steeper one way than the other ($a \ll b$) is the awkward case, because the
rate that is safe for the steep direction is slow for the shallow one.

Everything above is true of this quadratic. For a general non-convex
function gradient descent is only guaranteed, at best, a local minimum, and
whether it reaches even that depends on the function and the learning rate.
`,
    related: [
      {
        ref: "research/consensus-dynamics-in-networks",
        kind: "mathematical",
        note: "Under its assumptions, the consensus iteration x ← x − dt·Lx is gradient descent on the graph-Laplacian energy ½xᵀLx, with the same kind of bound on the step size. The same mathematics read in two places, not the same demonstration.",
      },
    ],
  },
  {
    slug: "reaction-kinetics",
    numeral: "III",
    title: "Reaction Kinetics",
    question: "How quickly does a reactant disappear when its rate is its own concentration?",
    description:
      "An idealised first-order reaction, A → products. Set the starting concentration and the rate constant, then follow the exponential decay, its half-life, and the moment-by-moment rate.",
    href: "/laboratory/reaction-kinetics",
    summary:
      "An interactive first-order decay, [A](t) = [A]₀e^(−kt): initial concentration, rate constant and elapsed time, with the concentration curve, a moving time indicator and the half-life.",
    notes: String.raw`
## The model

An elementary reaction $\mathrm{A} \to \text{products}$ is first order when
its rate is proportional to how much A remains:

$$
\frac{d[\mathrm{A}]}{dt} = -k\,[\mathrm{A}], \qquad k \ge 0,
$$

which integrates to an exponential decay from the initial concentration,

$$
[\mathrm{A}](t) = [\mathrm{A}]_0\, e^{-kt}.
$$

## The half-life

Setting $[\mathrm{A}] = \tfrac{1}{2}[\mathrm{A}]_0$ gives

$$
t_{1/2} = \frac{\ln 2}{k},
$$

which does not involve $[\mathrm{A}]_0$ at all. Whatever the concentration,
the next halving takes the same time as the last — the signature of
first-order kinetics, and the reason the dashed markers on the plot are
equally spaced. When $k = 0$ nothing reacts, the concentration stays where it
started, and there is no half-life to speak of.

## What is assumed

Units are illustrative — mol L⁻¹ for concentration, seconds for time, s⁻¹
for $k$ — and no particular real reaction is meant. The particles in the
lower panel are a tally, not a simulation: at each instant the number shown
is the fraction of A remaining, rounded to one in a hundred.
`,
    related: [],
  },
  {
    slug: "fourier-explorer",
    numeral: "IV",
    title: "Fourier Explorer",
    question: "What does a periodic signal look like taken apart, one frequency at a time?",
    description:
      "A finite sum of sine waves, built one harmonic at a time. Set how many harmonics are active, their common fundamental frequency, and each one's own amplitude and phase, then watch the sum in time and its discrete amplitude spectrum update together.",
    href: "/laboratory/fourier-explorer",
    summary:
      "An interactive finite Fourier series: harmonic count, fundamental frequency, and per-harmonic amplitude and phase, with the time-domain sum, its individual components, and the discrete amplitude spectrum shown side by side.",
    notes: String.raw`
## The model

A finite Fourier series sums $N$ sine waves, each an integer multiple of one
fundamental frequency $f_0$:

$$
f(t) = \sum_{n=1}^{N} A_n \sin\!\big(2\pi n f_0 t + \varphi_n\big).
$$

The $n$-th term — the $n$-th *harmonic* — has its own frequency $n f_0$,
amplitude $A_n$ and phase $\varphi_n$; harmonic $1$ is the fundamental
itself. Superposition is linear, so the sum at any instant is just the terms
added together, exactly as in the Wave Superposition instrument — this one
simply allows more than two.

This is a **Fourier series**, built for a signal that already repeats every
$1/f_0$ seconds. It is not a **Fourier transform**: a transform takes a
signal — periodic or not — and produces a function of *continuous*
frequency, via an integral over all time, not a sum of finitely many terms.
Nothing here computes one. What a Fourier transform of a genuinely periodic
signal returns is, in fact, exactly this: a discrete set of spikes at $0,
f_0, 2f_0, \dots$ — which is why the lower panel is drawn as discrete lines
rather than a continuous curve. It is the spectrum of what this instrument
builds, not an approximation of something else.

## The presets, and why their coefficients are what they are

A true square wave's Fourier series carries only the *odd* harmonics, with
amplitude $4/(n\pi)$:

$$
\mathrm{square}(t) = \frac{4}{\pi}\sum_{n \text{ odd}} \frac{1}{n}\sin(2\pi n f_0 t).
$$

A true sawtooth's series carries *every* harmonic, at $2/(n\pi)$, alternating
in sign:

$$
\mathrm{sawtooth}(t) = \frac{2}{\pi}\sum_{n=1}^{\infty} \frac{(-1)^{n+1}}{n}\sin(2\pi n f_0 t).
$$

A negative coefficient is the same sine with its amplitude's sign flipped —
equivalently, the same amplitude with $\pi$ added to the phase, since
$\sin(\theta + \pi) = -\sin\theta$. Every amplitude in this instrument is
non-negative; the sawtooth preset's alternating sign is carried entirely in
$\varphi_n$, set to $0$ or $\pi$.

Both series are infinite. The presets here use all 8 harmonics this
instrument allows and are only that — an approximation, visibly short of the
sharp corner or edge they are approaching. Lower the harmonic count on
either preset and the approximation visibly coarsens; the ripple that
remains near each discontinuity even at 8 harmonics, and which does not
shrink away as more are added, has a name — the **Gibbs phenomenon** — and
is a real feature of truncating this particular kind of series, not a flaw
in the instrument.

## What the two panels show

The upper panel is $f(t)$ against time, over two fundamental periods; the
individual harmonics may be shown alongside it, each too faint to read on
its own but visibly entering the sum. The lower panel is the amplitude
spectrum: one line per *active* harmonic, placed at its own frequency $n
f_0$ with height $A_n$. Phase does not appear on that axis — it is set, per
harmonic, in the controls below — which is itself worth noticing: two
signals can share an amplitude spectrum and still look nothing alike in
time, if their harmonics are shifted relative to one another.

Amplitude is in arbitrary units, as elsewhere in the Little Laboratory;
frequency is in hertz and time in seconds.
`,
    related: [],
  },
  {
    slug: "quantum-mechanics-explorer",
    numeral: "V",
    title: "Quantum Mechanics Explorer",
    question: "What does it mean for a particle to be confined, in superposition, or measured?",
    description:
      "One particle in a one-dimensional box, put to four tests: its stationary states, a superposition of them evolving in time, its odds of crossing a barrier it classically couldn't, and what repeated measurement of its position actually samples.",
    href: "/laboratory/quantum-mechanics-explorer",
    summary:
      "An interactive one-dimensional quantum particle: infinite-well eigenstates and their energies, a time-evolving superposition of a few of them, exact transmission and reflection off a finite rectangular barrier, and seeded, reproducible position measurements compared against the theoretical probability density.",
    notes: String.raw`
## The model

A particle of mass $m$ confined to an infinite square well of width $L$ — a
box with impenetrable walls at $x=0$ and $x=L$ — has stationary states

$$
\psi_n(x) = \sqrt{\tfrac{2}{L}}\,\sin\!\left(\frac{n\pi x}{L}\right), \qquad
E_n = \frac{n^2\pi^2\hbar^2}{2mL^2}, \qquad n = 1, 2, 3, \dots
$$

each already normalized ($\int_0^L \psi_n^2\,dx = 1$) and mutually
orthogonal. Natural units are used throughout — $\hbar = 1$ — so mass,
length and energy are dimensionless sliders, not measured quantities; see
OpenStax *University Physics Volume 3*, §7.4, "The Quantum Particle in a
Box", for the same derivation worked from the boundary conditions up.

**A. Particle in a Box** draws $\psi_n$ and $|\psi_n|^2$ directly from this,
alongside the energy ladder — $E_n \propto n^2$, so the levels spread apart
rather than stay evenly spaced, and $E_n \propto 1/mL^2$, so a wider well or
heavier particle lowers every level at once. The panel distinguishes the two
curves on purpose: $\psi_n$ changes sign $n-1$ times inside the well, while
$|\psi_n|^2$ — what a measurement actually samples — never goes negative.

**B. Superposition & Time Evolution** combines a few $\psi_n$ with
independent, renormalized weights $c_n$ into
$\Psi(x,t) = \sum_n c_n\,\psi_n(x)\,e^{-iE_nt}$, each term carrying its own
energy-dependent phase. A single active term is a bare stationary state,
whose density $|\Psi|^2 = \psi_n(x)^2$ never changes — $|e^{-i\theta}| = 1$
for any real $\theta$ — which is the precise sense in which it is
"stationary". With two or more terms of different energy the cross terms
between them beat at $|E_n - E_m|$, and the density genuinely redistributes
over time, repeating every $2\pi/|E_n-E_m|$.

**C. Quantum Tunneling** replaces the well with a finite rectangular barrier
of height $V_0$ and width $a$, and asks for the transmission and reflection
probabilities of a particle of energy $E$ incident on it — solved exactly
from the boundary-matched scattering state, not approximated:

$$
T = \left[1 + \frac{V_0^2 \sinh^2(\kappa a)}{4E(V_0-E)}\right]^{-1}\!\! (E<V_0), \quad
T = \left[1 + \frac{V_0^2 \sin^2(k'a)}{4E(E-V_0)}\right]^{-1}\!\! (E>V_0),
$$

with $\kappa=\sqrt{2m(V_0-E)}$, $k'=\sqrt{2m(E-V_0)}$, and $R = 1-T$ exactly,
by construction. At $E=V_0$ both expressions above divide by zero while
their numerators also vanish; the instrument uses the closed-form limit,
$T = \left[1+mV_0a^2/2\right]^{-1}$, confirmed to match the value either
formula approaches as $E\to V_0$. Above the barrier ($E>V_0$) the particle is
classically free to pass, yet $T<1$ still — part of the wave reflects even
there, which a classical particle rolling over a rise never would. $T$ and
$R$ are probabilities; they are not read off the height of the wavefunction
plot, which shows an amplitude.

**D. Measurement & Probability** draws simulated position measurements
directly from $|\psi_n(x)|^2$ by rejection sampling — $\sin^2$'s maximum is
exactly 1, so the sampling envelope is exact, not estimated — using a small
seeded generator (mulberry32), so the same seed and count reproduce the
exact same positions every time. The growing histogram is compared against
the theoretical curve it was drawn from. This samples the distribution a
measurement is already known to follow; it is not a simulation of a
classical particle's trajectory inside the well, which quantum mechanics
does not assign it.

## What this does not claim

Every quantity above is dimensionless and relative — nothing here is
calibrated to a real material, trap, or laboratory measurement. The barrier
in Mode C is an idealized rectangle, not any particular physical junction.
"Measurement" in Mode D means sampling the Born-rule distribution; it says
nothing about the physical process of measurement itself, a question this
instrument does not take a position on.
`,
    related: [],
  },
];

export const LABORATORY_PREFIX = "laboratory/";
export const isLaboratoryRef = (ref: string) => ref.startsWith(LABORATORY_PREFIX);
export const experimentForRef = (ref: string) =>
  isLaboratoryRef(ref) ? getExperiment(ref.slice(LABORATORY_PREFIX.length)) : undefined;

export const getExperiment = (slug: string) => experiments.find((e) => e.slug === slug);

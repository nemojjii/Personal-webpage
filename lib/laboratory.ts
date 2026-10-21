/**
 * The Little Laboratory's three experiments: what the landing page lists,
 * what the sitemap includes, and the model notes each page sets beneath its
 * instrument. The mathematics itself lives in lib/laboratory/*.ts.
 */

export interface Experiment {
  slug: string;
  numeral: "I" | "II" | "III";
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
  },
];

export const getExperiment = (slug: string) => experiments.find((e) => e.slug === slug);

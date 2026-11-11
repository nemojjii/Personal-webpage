import { getExperiment } from "@/lib/laboratory";
import { LabFrame } from "@/components/laboratory/ui";

const experiment = getExperiment("gravitation-orbit-console")!;
const CONSOLE_URL = experiment.externalHref!;

/**
 * The one instrument in the Little Laboratory that is not built on this
 * page: a launch panel for a numerical orbit simulator hosted as a Claude
 * artifact, rather than an inline SVG instrument. See the notes below for
 * what that distinction means.
 */
export function GravitationOrbitConsole() {
  return (
    <LabFrame
      caption={
        <>
          Opens in a new tab. It is hosted outside this site, not drawn by a module in{" "}
          <code>lib/laboratory/</code> like the other five — see the notes below for what that
          means here.
        </>
      }
    >
      <div className="flex flex-col items-start gap-6 px-1 py-6 sm:px-3">
        <p className="max-w-[34rem] font-serif text-[1.0625rem] leading-[1.6] text-ink-soft">
          Set a position and velocity near Earth, run the numerical integration, and read the
          simulated trajectory off against the closed-form prediction for the same initial
          condition — impact velocity, escape velocity, the speed of a circular orbit, or the
          eccentricity, semi-major axis and period of an ellipse.
        </p>
        <a
          href={CONSOLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-rule px-5 py-2.5 font-sans text-[0.8125rem] font-medium tracking-[0.02em] text-ink transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          Open the Gravitation Orbit Console
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </LabFrame>
  );
}

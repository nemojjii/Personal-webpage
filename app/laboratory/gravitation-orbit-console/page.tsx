import type { Metadata } from "next";

import { ExperimentPage } from "@/components/laboratory/ExperimentPage";
import { GravitationOrbitConsole } from "@/components/laboratory/GravitationOrbitConsole";
import { getExperiment } from "@/lib/laboratory";

const experiment = getExperiment("gravitation-orbit-console")!;

export const metadata: Metadata = {
  title: `${experiment.title} — Little Laboratory`,
  description: experiment.summary,
  alternates: { canonical: experiment.href },
};

export default function Page() {
  return (
    <ExperimentPage experiment={experiment}>
      <GravitationOrbitConsole />
    </ExperimentPage>
  );
}

import type { Metadata } from "next";

import { ExperimentPage } from "@/components/laboratory/ExperimentPage";
import { OrbitalMechanicsExplorer } from "@/components/laboratory/OrbitalMechanicsExplorer";
import { getExperiment } from "@/lib/laboratory";

const experiment = getExperiment("orbital-mechanics-explorer")!;

export const metadata: Metadata = {
  title: `${experiment.title} — Little Laboratory`,
  description: experiment.summary,
  alternates: { canonical: experiment.href },
};

export default function Page() {
  return (
    <ExperimentPage experiment={experiment}>
      <OrbitalMechanicsExplorer />
    </ExperimentPage>
  );
}

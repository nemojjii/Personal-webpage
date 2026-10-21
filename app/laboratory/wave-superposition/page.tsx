import type { Metadata } from "next";

import { ExperimentPage } from "@/components/laboratory/ExperimentPage";
import { WaveSuperposition } from "@/components/laboratory/WaveSuperposition";
import { getExperiment } from "@/lib/laboratory";

const experiment = getExperiment("wave-superposition")!;

export const metadata: Metadata = {
  title: `${experiment.title} — Little Laboratory`,
  description: experiment.summary,
  alternates: { canonical: experiment.href },
};

export default function Page() {
  return (
    <ExperimentPage experiment={experiment}>
      <WaveSuperposition />
    </ExperimentPage>
  );
}

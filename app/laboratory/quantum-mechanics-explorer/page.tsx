import type { Metadata } from "next";

import { ExperimentPage } from "@/components/laboratory/ExperimentPage";
import { QuantumExplorer } from "@/components/laboratory/QuantumExplorer";
import { getExperiment } from "@/lib/laboratory";

const experiment = getExperiment("quantum-mechanics-explorer")!;

export const metadata: Metadata = {
  title: `${experiment.title} — Little Laboratory`,
  description: experiment.summary,
  alternates: { canonical: experiment.href },
};

export default function Page() {
  return (
    <ExperimentPage experiment={experiment}>
      <QuantumExplorer />
    </ExperimentPage>
  );
}

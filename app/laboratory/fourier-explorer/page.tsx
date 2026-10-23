import type { Metadata } from "next";

import { ExperimentPage } from "@/components/laboratory/ExperimentPage";
import { FourierExplorer } from "@/components/laboratory/FourierExplorer";
import { getExperiment } from "@/lib/laboratory";

const experiment = getExperiment("fourier-explorer")!;

export const metadata: Metadata = {
  title: `${experiment.title} — Little Laboratory`,
  description: experiment.summary,
  alternates: { canonical: experiment.href },
};

export default function Page() {
  return (
    <ExperimentPage experiment={experiment}>
      <FourierExplorer />
    </ExperimentPage>
  );
}

import type { Metadata } from "next";

import { ExperimentPage } from "@/components/laboratory/ExperimentPage";
import { GradientDescent } from "@/components/laboratory/GradientDescent";
import { getExperiment } from "@/lib/laboratory";

const experiment = getExperiment("gradient-descent")!;

export const metadata: Metadata = {
  title: `${experiment.title} — Little Laboratory`,
  description: experiment.summary,
  alternates: { canonical: experiment.href },
};

export default function Page() {
  return (
    <ExperimentPage experiment={experiment}>
      <GradientDescent />
    </ExperimentPage>
  );
}

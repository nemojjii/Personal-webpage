import type { Metadata } from "next";

import { ExperimentPage } from "@/components/laboratory/ExperimentPage";
import { ReactionKinetics } from "@/components/laboratory/ReactionKinetics";
import { getExperiment } from "@/lib/laboratory";

const experiment = getExperiment("reaction-kinetics")!;

export const metadata: Metadata = {
  title: `${experiment.title} — Little Laboratory`,
  description: experiment.summary,
  alternates: { canonical: experiment.href },
};

export default function Page() {
  return (
    <ExperimentPage experiment={experiment}>
      <ReactionKinetics />
    </ExperimentPage>
  );
}

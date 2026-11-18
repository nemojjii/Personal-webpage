import type { Metadata } from "next";

import { ExperimentPage } from "@/components/laboratory/ExperimentPage";
import { StandingWaves } from "@/components/laboratory/StandingWaves";
import { getExperiment } from "@/lib/laboratory";

const experiment = getExperiment("standing-waves")!;

export const metadata: Metadata = {
  title: `${experiment.title} — Little Laboratory`,
  description: experiment.summary,
  alternates: { canonical: experiment.href },
};

export default function Page() {
  return (
    <ExperimentPage experiment={experiment}>
      <StandingWaves />
    </ExperimentPage>
  );
}

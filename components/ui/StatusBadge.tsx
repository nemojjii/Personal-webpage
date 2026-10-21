import { type ResearchStatus, researchStatuses } from "@/lib/types";

const TONE: Record<ResearchStatus, string> = {
  publication: "text-accent before:bg-accent",
  "in-progress": "text-ink before:bg-ink",
  completed: "text-ink-soft before:bg-ink-soft",
  idea: "text-ink-muted before:bg-ink-muted",
};

export function StatusBadge({ status }: { status: ResearchStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans text-[0.6875rem] font-medium tracking-[0.12em] uppercase
                  before:h-[5px] before:w-[5px] before:rounded-full before:content-[''] ${TONE[status]}`}
    >
      {researchStatuses[status].label}
    </span>
  );
}

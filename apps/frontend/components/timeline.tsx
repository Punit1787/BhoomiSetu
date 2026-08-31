import { Check, Circle } from "lucide-react";
import { stages, stageLabel } from "@/lib/demo-data";
import type { CaseStage, StageHistory } from "@/lib/types";

export function Timeline({ current, history = [] }: { current: CaseStage; history?: StageHistory[] }) {
  const currentIndex = stages.indexOf(current);
  return (
    <ol className="timeline" aria-label="Case progress">
      {stages.map((stage, index) => {
        const record = history.find((entry) => entry.to_stage === stage);
        const complete = index <= currentIndex;
        return (
          <li className={complete ? "complete" : ""} key={stage}>
            <span className="timelineIcon">{complete ? <Check size={15} /> : <Circle size={13} />}</span>
            <div><strong>{stageLabel(stage)}</strong><small>{record ? new Date(record.created_at).toLocaleDateString("en-IN") : "Pending"}</small></div>
          </li>
        );
      })}
    </ol>
  );
}

import { stageLabel } from "@/lib/demo-data";

export function StatusBadge({ value }: { value: string }) {
  return <span className={`badge badge-${value}`}>{stageLabel(value)}</span>;
}

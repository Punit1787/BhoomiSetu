import { ArrowUpRight, MapPin } from "lucide-react";
import type { CaseDetail } from "@/lib/types";
import { caseReference } from "@/lib/demo-data";
import { StatusBadge } from "./status-badge";

export function CaseCard({ item, selected, onSelect }: { item: CaseDetail; selected?: boolean; onSelect?: () => void }) {
  return (
    <button className={`caseCard ${selected ? "selected" : ""}`} onClick={onSelect} type="button">
      <span className="caseTop"><span><MapPin size={14} /> Kharadi · Survey {item.parcel_id.slice(-3)}</span><ArrowUpRight size={17} /></span>
      <strong>{caseReference(item)}</strong>
      <span className="caseBottom"><StatusBadge value={item.current_stage} /><small>Updated today</small></span>
    </button>
  );
}

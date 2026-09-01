"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  IndianRupee,
  Landmark,
  MessageSquareText,
  Route,
  Search,
  UploadCloud,
  Users,
  WalletCards,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CaseCard } from "@/components/case-card";
import { PortalShell } from "@/components/portal-shell";
import { StatusBadge } from "@/components/status-badge";
import { Timeline } from "@/components/timeline";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { caseReference, demoCases, demoParcels, stages } from "@/lib/demo-data";
import type { CaseDetail, CaseStage, Role } from "@/lib/types";

const ParcelMap = dynamic(() => import("@/components/parcel-map"), {
  ssr: false,
  loading: () => <div className="mapLoading">Loading acquisition map…</div>,
});
const validRoles: Role[] = [
  "landowner",
  "officer",
  "authority",
  "district_admin",
  "senior_admin",
];

function Metric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Clock3;
}) {
  return (
    <article className="metric">
      <span>
        <Icon size={19} />
      </span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function CitizenView({ cases, demoMode }: { cases: CaseDetail[]; demoMode: boolean }) {
  const [selectedId, setSelectedId] = useState(cases[0]?.id);
  const [file, setFile] = useState<File | null>(null);
  const [grievance, setGrievance] = useState("");
  const [documentStatus, setDocumentStatus] = useState("");
  const [grievanceStatus, setGrievanceStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const mine = cases.slice(0, 3);
  const selectedSummary = cases.find((item) => item.id === selectedId) ?? cases[0];
  const detailQuery = useQuery({
    queryKey: ["case", selectedSummary?.id],
    queryFn: () => api.caseDetail(selectedSummary!.id),
    enabled: !demoMode && !!selectedSummary,
  });
  const selected = detailQuery.data ?? selectedSummary;
  if (!selected) {
    return <section className="panel emptyState"><FileText /><h2>No linked acquisition cases</h2><p>This account cannot view cases until an authorized project authority links it to a parcel.</p></section>;
  }
  const currentStageIndex = stages.indexOf(selected.current_stage);
  const nextMilestone: CaseStage | "Complete" =
    currentStageIndex >= 0 && currentStageIndex < stages.length - 1
      ? stages[currentStageIndex + 1]
      : "Complete";
  const upload = async () => {
    if (!file) return;
    setSubmitting(true);
    setDocumentStatus("");
    try {
      if (demoMode) {
        await new Promise((resolve) => setTimeout(resolve, 450));
        setDocumentStatus(`${file.name} extracted with demo OCR; officer confirmation required.`);
      } else {
        const result = await api.uploadDocument(selected.id, file);
        setDocumentStatus(`${file.name} ${result.status}; ${Math.round(result.fields.confidence * 100)}% extraction confidence.`);
      }
    } catch (error) {
      setDocumentStatus(error instanceof Error ? error.message : "Document upload failed.");
    } finally {
      setSubmitting(false);
    }
  };
  const submitGrievance = async () => {
    if (grievance.trim().length < 10) {
      setGrievanceStatus("Please provide at least 10 characters.");
      return;
    }
    setSubmitting(true);
    setGrievanceStatus("");
    try {
      if (demoMode) {
        await new Promise((resolve) => setTimeout(resolve, 350));
        setGrievanceStatus("Demo grievance classified as process · medium priority · officer confirmation required.");
      } else {
        const result = await api.createGrievance(selected.id, grievance);
        setGrievanceStatus(`${result.classification.category} · ${result.classification.priority} priority · ${result.classification.suggested_department}`);
      }
      setGrievance("");
    } catch (error) {
      setGrievanceStatus(error instanceof Error ? error.message : "Grievance submission failed.");
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
      <section className="metricGrid">
        <Metric
          label="Active cases"
          value={String(mine.length)}
          detail={`Across ${mine.length} linked land parcel${mine.length === 1 ? "" : "s"}`}
          icon={FileText}
        />
        <Metric
          label="Compensation assessed"
          value={demoMode ? "₹42.8L" : "Tracked"}
          detail={demoMode ? "₹28.5L disbursed" : "No amount prediction is performed"}
          icon={IndianRupee}
        />
        <Metric
          label="Open grievance"
          value={demoMode ? "1" : "Submit below"}
          detail={demoMode ? "Response due in 2 days" : "Classification is human-confirmed"}
          icon={MessageSquareText}
        />
        <Metric
          label="Next milestone"
          value={nextMilestone.replaceAll("_", " ")}
          detail={nextMilestone === "Complete" ? "Lifecycle completed" : "Next legal workflow stage"}
          icon={Clock3}
        />
      </section>
      <section className="contentGrid citizenGrid">
        <div className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">My land acquisition cases</p>
              <h2>Know exactly where you stand</h2>
            </div>
            <span className="count">{mine.length} case{mine.length === 1 ? "" : "s"}</span>
          </div>
          <div className="caseList">
            {mine.map((item) => (
              <CaseCard
                item={item}
                selected={selected.id === item.id}
                onSelect={() => setSelectedId(item.id)}
                key={item.id}
              />
            ))}
          </div>
        </div>
        <div className="panel caseDetail">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">{caseReference(selected)}</p>
              <h2>Case journey</h2>
            </div>
            <StatusBadge value={selected.current_stage} />
          </div>
          <Timeline
            current={selected.current_stage}
            history={selected.stage_history}
          />
          <div className="responsibility">
            <ClipboardCheck />
            <span>
              <small>Currently responsible</small>
              <strong>Land Acquisition Officer · Pune District</strong>
            </span>
            <span className="due">Due in 4 days</span>
          </div>
        </div>
      </section>
      <section className="contentGrid actionGrid">
        <div className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">Secure documents</p>
              <h2>Upload or replace a document</h2>
            </div>
            <FileCheck2 />
          </div>
          <label className="dropzone">
            <UploadCloud />
            <strong>{file?.name || "Choose ownership document"}</strong>
            <small>PNG, JPG or TIFF · Maximum 10 MB</small>
            <input
              type="file"
              accept="image/png,image/jpeg,image/tiff"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          {file && (
            <button className="button primary" disabled={submitting} onClick={upload}>
              <UploadCloud size={17} /> Extract document
            </button>
          )}
          {documentStatus && <p className="successNote" role="status"><CheckCircle2 /> {documentStatus}</p>}
        </div>
        <div className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">Citizen support</p>
              <h2>Raise a grievance</h2>
            </div>
            <MessageSquareText />
          </div>
          <textarea
            placeholder="Describe the issue in your own words…"
            value={grievance}
            onChange={(event) => setGrievance(event.target.value)}
          />
          <button className="button primary" disabled={submitting} onClick={submitGrievance}>
            Submit grievance <ArrowRight size={17} />
          </button>
          {grievanceStatus && <p className="successNote" role="status"><CheckCircle2 /> {grievanceStatus}</p>}
          <div className="grievanceRow">
            <span>
              <i /> GRV-2026-018
            </span>
            <StatusBadge value="under_review" />
          </div>
        </div>
      </section>
    </>
  );
}

function OfficerView({ cases, demoMode }: { cases: CaseDetail[]; demoMode: boolean }) {
  const queryClient = useQueryClient();
  const [stageFilter, setStageFilter] = useState("all");
  const [actionStatus, setActionStatus] = useState("");
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [stageOverrides, setStageOverrides] = useState<Record<string, CaseStage>>({});
  const effectiveCases = cases.map((item) => ({
    ...item,
    current_stage: stageOverrides[item.id] ?? item.current_stage,
  }));
  const filtered =
    stageFilter === "all"
      ? effectiveCases.slice(0, 8)
      : effectiveCases.filter((item) => item.current_stage === stageFilter).slice(0, 8);
  const advance = async (item: CaseDetail) => {
    const index = stages.indexOf(item.current_stage);
    const nextStage = stages[index + 1];
    if (!nextStage) return;
    setAdvancing(item.id);
    setActionStatus("");
    try {
      if (demoMode) await new Promise((resolve) => setTimeout(resolve, 350));
      else await api.transition(item.id, nextStage, "Verified and advanced from officer portal");
      setStageOverrides((current) => ({ ...current, [item.id]: nextStage }));
      if (!demoMode) await queryClient.invalidateQueries({ queryKey: ["cases"] });
      setActionStatus(`${caseReference(item)} advanced to ${nextStage}. ${demoMode ? "Demo state only." : "Audit and stage history recorded."}`);
    } catch (error) {
      setActionStatus(error instanceof Error ? error.message : "Stage transition failed.");
    } finally {
      setAdvancing(null);
    }
  };
  return (
    <>
      <section className="metricGrid">
        <Metric
          label="Assigned cases"
          value="12"
          detail="3 need action today"
          icon={FileText}
        />
        <Metric
          label="Verification queue"
          value="4"
          detail="2 AI extractions ready"
          icon={ClipboardCheck}
        />
        <Metric
          label="Open grievances"
          value="3"
          detail="1 approaching SLA"
          icon={MessageSquareText}
        />
        <Metric
          label="Field completion"
          value="84%"
          detail="This week"
          icon={CheckCircle2}
        />
      </section>
      <section className="contentGrid officerGrid">
        <div className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">Field workload</p>
              <h2>Assigned cases</h2>
            </div>
            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
            >
              <option value="all">All stages</option>
              {stages.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </select>
          </div>
          <div className="caseTable">
            {filtered.map((item) => (
              <div key={item.id}>
                <span>
                  <strong>{caseReference(item)}</strong>
                  <small>Kharadi · Survey {item.parcel_id.slice(-3)}</small>
                </span>
                <StatusBadge value={item.current_stage} />
                <button aria-label={`Advance ${caseReference(item)}`} disabled={advancing === item.id || item.current_stage === "possession"} onClick={() => advance(item)}>
                  {advancing === item.id ? <Clock3 size={17} /> : <ArrowRight size={17} />}
                </button>
              </div>
            ))}
          </div>
          {actionStatus && <p className="successNote" role="status"><CheckCircle2 /> {actionStatus}</p>}
        </div>
        <div className="panel verifyPanel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">AI-assisted verification</p>
              <h2>Document check</h2>
            </div>
            <span className="count">2 ready</span>
          </div>
          <div className="documentPreview">
            <FileText />
            <span>7/12 extract.pdf</span>
          </div>
          <div className="extracted">
            <p>
              <span>Owner name</span>
              <strong>Asha Dattatray Patil</strong>
            </p>
            <p>
              <span>Survey number</span>
              <strong>KH-101</strong>
            </p>
            <p>
              <span>Area</span>
              <strong>0.72 hectare</strong>
            </p>
            <p>
              <span>Confidence</span>
              <strong className="confidence">96.4%</strong>
            </p>
          </div>
          <div className="buttonRow">
            <button className="button danger">Return</button>
            <button className="button primary">
              <CheckCircle2 size={17} /> Confirm fields
            </button>
          </div>
        </div>
      </section>
      <section className="mobileAction">
        <ClipboardCheck />
        <span>
          <strong>3 actions due today</strong>
          <small>Optimized field-officer mobile queue</small>
        </span>
        <ArrowRight />
      </section>
    </>
  );
}

function AuthorityView({ cases }: { cases: CaseDetail[] }) {
  const [selectedCase, setSelectedCase] = useState(cases[0]?.id);
  const demoMode = useAuthStore((state) => state.demoMode);
  const [record, setRecord] = useState<{
    owner: string;
    survey: string;
    area: string;
    notice: string;
  } | null>(null);
  const [checking, setChecking] = useState(false);
  const selectedLiveCase =
    cases.find((item) => item.id === selectedCase) ?? cases[0];
  const delayQuery = useQuery({
    queryKey: ["prediction", "delay", selectedLiveCase?.id],
    queryFn: () => api.delayPrediction(selectedLiveCase!.id),
    enabled: !demoMode && !!selectedLiveCase,
  });
  const checkLandRecord = async () => {
    setChecking(true);
    try {
      if (demoMode) {
        await new Promise((resolve) => setTimeout(resolve, 450));
        setRecord({
          owner: "Asha Dattatray Patil",
          survey: "KH-101",
          area: "0.72 hectare",
          notice: "Prototype fixture — not live government data",
        });
      } else {
        const response = await api.landRecord("KH-101");
        setRecord({
          owner: response.owner.name,
          survey: response.survey_number,
          area: `${response.area.value} ${response.area.unit}`,
          notice: response.source.notice,
        });
      }
    } finally {
      setChecking(false);
    }
  };
  const counts = stages.map((stage) => ({
    stage,
    count: cases.filter((item) => item.current_stage === stage).length,
  }));
  return (
    <>
      <section className="metricGrid">
        <Metric
          label="Total project area"
          value="24.7 ha"
          detail="20 mapped parcels"
          icon={Landmark}
        />
        <Metric
          label="Cases progressing"
          value="17/20"
          detail="85% active flow"
          icon={Route}
        />
        <Metric
          label="Compensation paid"
          value="₹3.82Cr"
          detail="67% of assessed"
          icon={WalletCards}
        />
        <Metric
          label="Attention required"
          value="3"
          detail="Across 2 stages"
          icon={AlertTriangle}
        />
      </section>
      <section className="contentGrid mapGrid">
        <div className="panel mapPanel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">Kharadi Bypass · GIS command view</p>
              <h2>Parcel acquisition map</h2>
            </div>
            <span className="count">OSM · 20 parcels</span>
          </div>
          <ParcelMap parcels={demoParcels} onSelect={setSelectedCase} />
        </div>
        <div className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">Stage distribution</p>
              <h2>Bottleneck view</h2>
            </div>
          </div>
          <div className="bottlenecks">
            {counts.map(({ stage, count }) => (
              <button key={stage}>
                <span>
                  <StatusBadge value={stage} />
                  <small>{count} cases</small>
                </span>
                <i style={{ width: `${Math.max(count * 22, 12)}%` }} />
              </button>
            ))}
          </div>
          <div className="selectedParcel">
            <Search />
            <span>
              <small>Selected from map</small>
              <strong>
                {cases.find((item) => item.id === selectedCase)
                  ? caseReference(cases.find((item) => item.id === selectedCase)!)
                  : "Click a parcel"}
              </strong>
            </span>
          </div>
          {delayQuery.data && (
            <div className="interopResult modelResult" role="status">
              <strong>{delayQuery.data.risk_band} delay risk · {delayQuery.data.predicted_days_remaining} days remaining</strong>
              <span>Case drivers: {delayQuery.data.top_features.map((item) => item.feature.replaceAll("_", " ")).join(", ")}</span>
              <small>Synthetic-trained {delayQuery.data.model_version} · holdout MAE {delayQuery.data.holdout_mae_days} days · not validated on real records</small>
            </div>
          )}
          {record && (
            <div className="interopResult" role="status">
              <strong>{record.owner}</strong>
              <span>
                {record.survey} · {record.area}
              </span>
              <small>{record.notice}</small>
            </div>
          )}
          <button
            className="interopButton"
            onClick={checkLandRecord}
            disabled={checking}
          >
            <Landmark />{" "}
            {checking
              ? "Contacting API Setu fixture…"
              : "Check Maharashtra land record"}{" "}
            <ArrowRight />
          </button>
        </div>
      </section>
    </>
  );
}

function DistrictView({ cases }: { cases: CaseDetail[] }) {
  return (
    <>
      <section className="metricGrid">
        <Metric
          label="District projects"
          value="8"
          detail="5 on schedule"
          icon={Landmark}
        />
        <Metric
          label="Affected families"
          value="1,248"
          detail="73% verified"
          icon={Users}
        />
        <Metric
          label="Area acquired"
          value="186 ha"
          detail="of 252 ha notified"
          icon={Route}
        />
        <Metric
          label="Audit exceptions"
          value="2"
          detail="Both under review"
          icon={AlertTriangle}
        />
      </section>
      <section className="contentGrid adminGrid">
        <div className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">Maharashtra → Pune</p>
              <h2>Project drill-down</h2>
            </div>
            <button className="button secondary">
              <Download size={16} /> Export
            </button>
          </div>
          <div className="districtRows">
            {[
              "Kharadi Bypass",
              "Pune Ring Road",
              "Metro Line 3",
              "Indapur Irrigation",
            ].map((name, index) => (
              <button key={name}>
                <span>
                  <strong>{name}</strong>
                  <small>
                    {20 + index * 13} parcels · {12 + index * 4} families
                  </small>
                </span>
                <span>
                  <b>{84 - index * 7}%</b>
                  <small>progress</small>
                </span>
                <ArrowRight />
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">Tamper-evident activity</p>
              <h2>Recent audit trail</h2>
            </div>
          </div>
          <div className="auditList">
            {cases.slice(0, 5).map((item, index) => (
              <div key={item.id}>
                <span className="auditIcon">
                  <FileCheck2 />
                </span>
                <span>
                  <strong>
                    {index % 2 ? "Document verified" : "Case stage advanced"}
                  </strong>
                  <small>
                    {caseReference(item)} · Officer {index + 1}
                  </small>
                </span>
                <time>{index + 2}h ago</time>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function SeniorView({ demoMode }: { demoMode: boolean }) {
  const aggregateQuery = useQuery({
    queryKey: ["predictions", "aggregate"],
    queryFn: api.aggregatePredictions,
    enabled: !demoMode,
  });
  const aggregate = aggregateQuery.data;
  const onTrack = aggregate ? Math.max(0, Math.round(100 - aggregate.high_risk_pct)) : 74;
  const riskRows: Array<[string, number]> = demoMode
    ? [
        ["Maharashtra highways", 38],
        ["Urban transit", 27],
        ["Irrigation", 19],
        ["Industrial corridors", 12],
      ]
    : aggregate
      ? [[`All ${aggregate.case_count} visible cases`, aggregate.high_risk_pct]]
      : [];
  const fields = [
    ["Area notified", "252 ha", "up 8.2%"],
    ["Area acquired", "186 ha", "73.8% complete"],
    ["Compensation assessed", "₹46.2Cr", "1,248 families"],
    ["Compensation paid", "₹31.8Cr", "68.8% disbursed"],
    ["R&R completed", "72%", "901 families"],
    ["Possession secured", "138 ha", "54.7% of area"],
  ];
  return (
    <>
      <section className="seniorHero">
        <div>
          <p className="sectionLabel">National programme pulse</p>
          <h2>
            Land acquisition is <em>{onTrack}% on track</em> across monitored projects.
          </h2>
        </div>
        <div className="riskScore">
          <span>{aggregate ? `${Math.round(aggregate.high_risk_pct)}%` : "26"}</span>
          <small>
            {aggregate ? "cases at" : "demo cases at"}
            <br />
            high delay risk
          </small>
        </div>
      </section>
      <section className="nationalGrid">
        {fields.map(([label, value, detail]) => (
          <article key={label}>
            <p>{label}</p>
            <strong>{value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>
      <p className="modelDisclosure">National MIS values are a synthetic demonstration scenario. {demoMode ? "Predictive values are demo fixtures." : "The predictive card below is calculated live from the synthetic-trained model endpoint."}</p>
      <section className="contentGrid seniorGrid">
        <div className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">Predictive intelligence</p>
              <h2>Delay-risk concentration</h2>
            </div>
            <StatusBadge value="model_active" />
          </div>
          <div className="riskBars">
            {riskRows.map(([label, value]) => (
              <div key={label}>
                <span>
                  <strong>{label}</strong>
                  <b>{value}% high risk</b>
                </span>
                <i>
                  <em style={{ width: `${value}%` }} />
                </i>
              </div>
            ))}
            {!demoMode && aggregate && <small className="modelNote">Average predicted compensation-disbursal timeline: {aggregate.avg_disbursal_days} days. Synthetic training data; real-world accuracy is not claimed.</small>}
          </div>
        </div>
        <div className="panel">
          <div className="panelHead">
            <div>
              <p className="sectionLabel">Timeline adherence</p>
              <h2>Leadership actions</h2>
            </div>
          </div>
          <div className="leadershipActions">
            <button>
              <AlertTriangle />
              <span>
                <strong>7 awards beyond SLA</strong>
                <small>Escalate to district collectors</small>
              </span>
              <ArrowRight />
            </button>
            <button>
              <Banknote />
              <span>
                <strong>₹4.6Cr ready to disburse</strong>
                <small>Review treasury batch</small>
              </span>
              <ArrowRight />
            </button>
            <button>
              <Users />
              <span>
                <strong>42 families need R&R action</strong>
                <small>Open rehabilitation queue</small>
              </span>
              <ArrowRight />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default function RolePortal() {
  const router = useRouter();
  const params = useParams<{ role: string }>();
  const role = params.role as Role;
  const user = useAuthStore((state) => state.user);
  const demoMode = useAuthStore((state) => state.demoMode);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated && (!user || !validRoles.includes(role) || user.role !== role))
      router.replace(user ? "/forbidden" : "/login");
  }, [hydrated, role, router, user]);
  const query = useQuery({
    queryKey: ["cases"],
    queryFn: api.cases,
    enabled: hydrated && !!user && !demoMode,
    retry: 1,
    refetchInterval: 30_000,
  });
  const cases = useMemo(
    () =>
      query.data
        ? query.data.map((item) => ({ ...item, stage_history: [] }))
        : demoMode
          ? demoCases
          : [],
    [demoMode, query.data],
  );
  if (!hydrated || !user || user.role !== role)
    return <main className="loadingPage">Securing your role workspace…</main>;
  if (!demoMode && query.isPending)
    return <main className="loadingPage">Loading your authorized cases…</main>;
  const copy = {
    landowner: [
      `Namaste, ${user.name.split(" ")[0]}`,
      "Your land, documents and compensation—clearly tracked.",
    ],
    officer: [
      "Today’s field desk",
      "Verify faster, resolve clearly, keep every case moving.",
    ],
    authority: [
      "Kharadi Bypass",
      "Project control across land, cases and bottlenecks.",
    ],
    district_admin: [
      "Pune district command",
      "Drill down, resolve exceptions and uphold accountability.",
    ],
    senior_admin: [
      "Executive oversight",
      "A national view of progress, public money and delivery risk.",
    ],
  }[role];
  return (
    <PortalShell role={role} title={copy[0]} subtitle={copy[1]}>
      {role === "landowner" && <CitizenView cases={cases} demoMode={demoMode} />}
      {role === "officer" && <OfficerView cases={cases} demoMode={demoMode} />}
      {role === "authority" && <AuthorityView cases={cases} />}
      {role === "district_admin" && <DistrictView cases={cases} />}
      {role === "senior_admin" && <SeniorView demoMode={demoMode} />}
    </PortalShell>
  );
}

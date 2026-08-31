export type Role = "landowner" | "officer" | "authority" | "district_admin" | "senior_admin";

export type CaseStage =
  | "notification"
  | "verification"
  | "objection"
  | "award"
  | "compensation"
  | "possession";

export interface SessionUser {
  id: string;
  full_name: string;
  email: string;
  role: Role;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: SessionUser;
}

export interface CaseSummary {
  id: string;
  case_number: string;
  project_id: string;
  parcel_id: string;
  landowner_id: string;
  current_stage: CaseStage;
  status: string;
  assigned_officer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StageHistory {
  id: string;
  from_stage?: CaseStage | null;
  to_stage: CaseStage;
  notes?: string | null;
  created_at: string;
}

export interface CaseDetail extends CaseSummary {
  stage_history: StageHistory[];
}

export interface ParcelFeature {
  id: string;
  survey_number: string;
  village: string;
  area_hectares: number;
  case_id: string;
  stage: CaseStage;
  coordinates: [number, number][];
}

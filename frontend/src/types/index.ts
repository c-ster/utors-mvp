// Synced with backend Pydantic schemas

export interface Soldier {
  edipi: string;
  rank: string;
  grade: string;
  last_name: string;
  first_name: string;
  mos: string;
  asi?: string;
  sqi?: string;
  unit_uic: string;
  ets_date?: string;
  deros?: string;
  deployable_status: 'Green' | 'Amber' | 'Red';
  security_clearance: string;
  ksbs?: string[];
  languages?: string[];
  civilian_certifications?: string[];
  hobbies_skills?: string[];
  desired_role?: string;
  family_considerations?: string;
  career_preferences?: string;
  intake_completed: boolean;
  is_incoming: boolean;
  is_outgoing: boolean;
  projected_loss_date?: string;
  projected_gain_date?: string;
  has_local_override: boolean;
  medical_code?: string;
}

export interface SoldierBrief {
  edipi: string;
  rank: string;
  last_name: string;
  first_name: string;
  mos: string;
  grade: string;
  deployable_status: string;
  ksbs?: string[];
}

export interface Billet {
  id: string;
  position_id: string;
  position_title: string;
  required_rank: string;
  required_mos: string;
  critical_ksbs?: string[];
  mission_criticality: number;
  is_key_billet: boolean;
  assigned_soldier_edipi?: string;
  assigned_soldier_name?: string;
  assigned_soldier_rank?: string;
}

export interface Unit {
  uic: string;
  unit_name: string;
  parent_uic?: string;
  echelon: string;
  unit_type: string;
  authorized_strength: number;
  assigned_strength: number;
  fill_percentage: number;
  children: UnitBrief[];
}

export interface UnitBrief {
  uic: string;
  unit_name: string;
  echelon: string;
  unit_type: string;
  authorized_strength: number;
  assigned_strength: number;
  fill_percentage: number;
  risk_level: string;
}

export interface UnitRoster {
  uic: string;
  unit_name: string;
  authorized_strength: number;
  assigned_strength: number;
  billets: Billet[];
}

export interface KsbGap {
  ksb: string;
  required_count: number;
  current_count: number;
  deficit: number;
  affected_billets: string[];
  risk_level: string;
}

export interface UnitGaps {
  uic: string;
  unit_name: string;
  gaps: KsbGap[];
  total_empty_billets: number;
  total_billets: number;
}

// Slate / Matching
export interface MatchScoreBreakdown {
  mtoe_fit: number;
  talent_fit: number;
  preference_fit: number;
}

export interface MatchResult {
  soldier_edipi: string;
  soldier_name: string;
  soldier_rank: string;
  soldier_mos: string;
  billet_id: string;
  billet_position_title: string;
  billet_required_rank: string;
  billet_required_mos: string;
  total_score: number;
  breakdown: MatchScoreBreakdown;
  flags: string[];
  ai_reasoning: string;
}

export interface SlateResponse {
  uic: string;
  unit_name: string;
  matches: MatchResult[];
  unslotted_soldiers: string[];
  unfilled_billets: string[];
}

// Dashboard
export interface StrengthGauge {
  authorized: number;
  assigned: number;
  percentage: number;
  status: string;
}

export interface RiskAlert {
  id: string;
  severity: string;
  title: string;
  description: string;
  unit_uic: string;
  unit_name: string;
  affected_ksb?: string;
}

export interface PersonnelTimelineEntry {
  date: string;
  gains: number;
  losses: number;
  net: number;
}

export interface SubunitRisk {
  uic: string;
  unit_name: string;
  echelon: string;
  risk_score: number;
  risk_level: string;
  fill_percentage: number;
  critical_gaps: number;
  recently_changed: boolean;
}

export interface DashboardMetrics {
  aggregate_risk_score: number;
  aggregate_risk_level: string;
  strength: StrengthGauge;
  talent_optimization_score: number;
  readiness_level: string;
  critical_alerts: RiskAlert[];
  subunit_risks: SubunitRisk[];
  personnel_timeline: PersonnelTimelineEntry[];
  total_incoming: number;
  total_outgoing: number;
  at_risk_soldiers: number;
  non_deployable_count: number;
}

// Auth
export interface MockPersona {
  key: string;
  name: string;
  rank: string;
  role: string;
}

export interface IntakeFormData {
  civilian_certifications?: string[];
  hobbies_skills?: string[];
  desired_role?: string;
  family_considerations?: string;
  career_preferences?: string;
}

from pydantic import BaseModel


class StrengthGauge(BaseModel):
    authorized: int
    assigned: int
    percentage: float
    status: str  # Green, Amber, Red


class RiskAlert(BaseModel):
    id: str
    severity: str  # Critical, High, Medium, Low
    title: str
    description: str
    unit_uic: str
    unit_name: str
    affected_ksb: str | None = None


class PersonnelTimelineEntry(BaseModel):
    date: str
    gains: int
    losses: int
    net: int


class SubunitRisk(BaseModel):
    uic: str
    unit_name: str
    echelon: str
    risk_score: float  # 0-100
    risk_level: str  # Green, Amber, Red
    fill_percentage: float
    critical_gaps: int
    recently_changed: bool = False


class DashboardMetrics(BaseModel):
    aggregate_risk_score: float
    aggregate_risk_level: str
    strength: StrengthGauge
    talent_optimization_score: float
    readiness_level: str
    critical_alerts: list[RiskAlert]
    subunit_risks: list[SubunitRisk]
    personnel_timeline: list[PersonnelTimelineEntry]
    total_incoming: int
    total_outgoing: int
    at_risk_soldiers: int
    non_deployable_count: int

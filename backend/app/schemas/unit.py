from pydantic import BaseModel


class BilletRead(BaseModel):
    id: str
    position_id: str
    position_title: str
    required_rank: str
    required_mos: str
    critical_ksbs: list[str] | None = None
    mission_criticality: int
    is_key_billet: bool
    assigned_soldier_edipi: str | None = None
    assigned_soldier_name: str | None = None
    assigned_soldier_rank: str | None = None

    model_config = {"from_attributes": True}


class UnitRead(BaseModel):
    uic: str
    unit_name: str
    parent_uic: str | None = None
    echelon: str
    unit_type: str
    authorized_strength: int
    assigned_strength: int = 0
    fill_percentage: float = 0.0
    children: list["UnitBrief"] = []

    model_config = {"from_attributes": True}


class UnitBrief(BaseModel):
    uic: str
    unit_name: str
    echelon: str
    unit_type: str
    authorized_strength: int
    assigned_strength: int = 0
    fill_percentage: float = 0.0
    risk_level: str = "Green"  # Green, Amber, Red

    model_config = {"from_attributes": True}


class UnitRoster(BaseModel):
    uic: str
    unit_name: str
    authorized_strength: int
    assigned_strength: int
    billets: list[BilletRead]


class KsbGap(BaseModel):
    ksb: str
    required_count: int
    current_count: int
    deficit: int
    affected_billets: list[str]
    risk_level: str  # Green, Amber, Red


class UnitGaps(BaseModel):
    uic: str
    unit_name: str
    gaps: list[KsbGap]
    total_empty_billets: int
    total_billets: int

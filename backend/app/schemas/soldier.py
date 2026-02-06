from pydantic import BaseModel
from datetime import date


class SoldierBase(BaseModel):
    edipi: str
    rank: str
    grade: str
    last_name: str
    first_name: str
    mos: str
    asi: str | None = None
    sqi: str | None = None
    unit_uic: str
    ets_date: date | None = None
    deros: date | None = None
    deployable_status: str = "Green"
    security_clearance: str = "Secret"
    ksbs: list[str] | None = None
    languages: list[str] | None = None
    is_incoming: bool = False
    is_outgoing: bool = False
    projected_loss_date: date | None = None
    projected_gain_date: date | None = None


class SoldierRead(SoldierBase):
    civilian_certifications: list[str] | None = None
    hobbies_skills: list[str] | None = None
    desired_role: str | None = None
    family_considerations: str | None = None
    career_preferences: str | None = None
    intake_completed: bool = False
    has_local_override: bool = False
    medical_code: str | None = None

    model_config = {"from_attributes": True}


class SoldierBrief(BaseModel):
    """Minimal soldier info for lists and references."""
    edipi: str
    rank: str
    last_name: str
    first_name: str
    mos: str
    grade: str
    deployable_status: str
    ksbs: list[str] | None = None

    model_config = {"from_attributes": True}


class SoldierUpdate(BaseModel):
    civilian_certifications: list[str] | None = None
    hobbies_skills: list[str] | None = None
    desired_role: str | None = None
    family_considerations: str | None = None
    career_preferences: str | None = None
    ksbs: list[str] | None = None
    languages: list[str] | None = None
    override_notes: str | None = None


class IntakeFormSubmission(BaseModel):
    civilian_certifications: list[str] | None = None
    hobbies_skills: list[str] | None = None
    desired_role: str | None = None
    family_considerations: str | None = None
    career_preferences: str | None = None

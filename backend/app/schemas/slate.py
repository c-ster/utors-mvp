from pydantic import BaseModel


class SlateGenerateRequest(BaseModel):
    uic: str
    include_incoming: bool = True


class MatchScoreBreakdown(BaseModel):
    mtoe_fit: float
    talent_fit: float
    preference_fit: float


class MatchResult(BaseModel):
    soldier_edipi: str
    soldier_name: str
    soldier_rank: str
    soldier_mos: str
    billet_id: str
    billet_position_title: str
    billet_required_rank: str
    billet_required_mos: str
    total_score: float
    breakdown: MatchScoreBreakdown
    flags: list[str]
    ai_reasoning: str


class SlateResponse(BaseModel):
    uic: str
    unit_name: str
    matches: list[MatchResult]
    unslotted_soldiers: list[str]
    unfilled_billets: list[str]


class SlateCommitRequest(BaseModel):
    uic: str
    assignments: list[dict]  # [{soldier_edipi, billet_id}]

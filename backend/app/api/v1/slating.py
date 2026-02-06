from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.unit import Unit, Billet, Assignment
from app.models.soldier import Soldier
from app.schemas.slate import (
    SlateGenerateRequest,
    SlateResponse,
    MatchResult,
    MatchScoreBreakdown,
    SlateCommitRequest,
)
from app.services.slate_engine import generate_slate

router = APIRouter(prefix="/slate", tags=["slating"])


@router.post("/generate", response_model=SlateResponse)
def generate_unit_slate(request: SlateGenerateRequest, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.uic == request.uic).first()
    if not unit:
        raise HTTPException(status_code=404, detail=f"Unit {request.uic} not found")

    # Get all billets for this unit
    billets = db.query(Billet).filter(Billet.unit_uic == request.uic).all()

    # Get available soldiers (incoming or unassigned in this unit)
    query = db.query(Soldier).filter(Soldier.unit_uic == request.uic)
    if request.include_incoming:
        incoming = db.query(Soldier).filter(
            Soldier.is_incoming == True,
            Soldier.unit_uic == request.uic,
        ).all()
        # Also include soldiers not yet assigned
        unassigned_edipis = set()
        assigned_edipis = {
            a.soldier_edipi
            for a in db.query(Assignment).join(Billet).filter(Billet.unit_uic == request.uic).all()
        }
        all_soldiers = query.all()
        soldiers = [s for s in all_soldiers if s.edipi not in assigned_edipis]
    else:
        assigned_edipis = {
            a.soldier_edipi
            for a in db.query(Assignment).join(Billet).filter(Billet.unit_uic == request.uic).all()
        }
        soldiers = [s for s in db.query(Soldier).filter(Soldier.unit_uic == request.uic).all()
                     if s.edipi not in assigned_edipis]

    result = generate_slate(soldiers, billets)

    matches = [
        MatchResult(
            soldier_edipi=m["soldier_edipi"],
            soldier_name=m["soldier_name"],
            soldier_rank=m["soldier_rank"],
            soldier_mos=m["soldier_mos"],
            billet_id=m["billet_id"],
            billet_position_title=m["billet_position_title"],
            billet_required_rank=m["billet_required_rank"],
            billet_required_mos=m["billet_required_mos"],
            total_score=m["total_score"],
            breakdown=MatchScoreBreakdown(**m["breakdown"]),
            flags=m["flags"],
            ai_reasoning=m["ai_reasoning"],
        )
        for m in result["matches"]
    ]

    return SlateResponse(
        uic=request.uic,
        unit_name=unit.unit_name,
        matches=matches,
        unslotted_soldiers=result["unslotted_soldiers"],
        unfilled_billets=result["unfilled_billets"],
    )


@router.post("/commit")
def commit_slate(request: SlateCommitRequest, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.uic == request.uic).first()
    if not unit:
        raise HTTPException(status_code=404, detail=f"Unit {request.uic} not found")

    committed = 0
    for assignment_data in request.assignments:
        soldier_edipi = assignment_data.get("soldier_edipi")
        billet_id = assignment_data.get("billet_id")

        if not soldier_edipi or not billet_id:
            continue

        # Remove existing assignment for this billet if any
        existing = db.query(Assignment).filter(Assignment.billet_id == billet_id).first()
        if existing:
            db.delete(existing)

        assignment = Assignment(
            billet_id=billet_id,
            soldier_edipi=soldier_edipi,
            is_ai_recommended=True,
        )
        db.add(assignment)
        committed += 1

    db.commit()
    return {"committed": committed, "uic": request.uic}

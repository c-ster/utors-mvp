from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.unit import Unit, Billet, Assignment
from app.models.soldier import Soldier
from app.schemas.unit import UnitRead, UnitBrief, UnitRoster, BilletRead, UnitGaps, KsbGap
from app.services.dashboard_service import compute_ksb_gaps, compute_unit_strength

router = APIRouter(prefix="/unit", tags=["units"])


@router.get("/{uic}", response_model=UnitRead)
def get_unit(uic: str, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.uic == uic).first()
    if not unit:
        raise HTTPException(status_code=404, detail=f"Unit {uic} not found")

    strength = compute_unit_strength(db, uic)
    children_units = db.query(Unit).filter(Unit.parent_uic == uic).all()

    children_briefs = []
    for child in children_units:
        child_strength = compute_unit_strength(db, child.uic)
        children_briefs.append(UnitBrief(
            uic=child.uic,
            unit_name=child.unit_name,
            echelon=child.echelon,
            unit_type=child.unit_type,
            authorized_strength=child.authorized_strength,
            assigned_strength=child_strength["assigned"],
            fill_percentage=child_strength["percentage"],
            risk_level=child_strength["status"],
        ))

    return UnitRead(
        uic=unit.uic,
        unit_name=unit.unit_name,
        parent_uic=unit.parent_uic,
        echelon=unit.echelon,
        unit_type=unit.unit_type,
        authorized_strength=unit.authorized_strength,
        assigned_strength=strength["assigned"],
        fill_percentage=strength["percentage"],
        children=children_briefs,
    )


@router.get("/{uic}/roster", response_model=UnitRoster)
def get_unit_roster(uic: str, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.uic == uic).first()
    if not unit:
        raise HTTPException(status_code=404, detail=f"Unit {uic} not found")

    billets = db.query(Billet).filter(Billet.unit_uic == uic).all()
    strength = compute_unit_strength(db, uic)

    billet_reads = []
    for b in billets:
        assigned_soldier = None
        if b.assignment:
            assigned_soldier = db.query(Soldier).filter(
                Soldier.edipi == b.assignment.soldier_edipi
            ).first()

        billet_reads.append(BilletRead(
            id=str(b.id),
            position_id=b.position_id,
            position_title=b.position_title,
            required_rank=b.required_rank,
            required_mos=b.required_mos,
            critical_ksbs=b.critical_ksbs,
            mission_criticality=b.mission_criticality,
            is_key_billet=b.is_key_billet,
            assigned_soldier_edipi=assigned_soldier.edipi if assigned_soldier else None,
            assigned_soldier_name=(
                f"{assigned_soldier.rank} {assigned_soldier.last_name}, {assigned_soldier.first_name}"
                if assigned_soldier else None
            ),
            assigned_soldier_rank=assigned_soldier.rank if assigned_soldier else None,
        ))

    return UnitRoster(
        uic=unit.uic,
        unit_name=unit.unit_name,
        authorized_strength=len(billets),
        assigned_strength=strength["assigned"],
        billets=billet_reads,
    )


@router.get("/{uic}/gaps", response_model=UnitGaps)
def get_unit_gaps(uic: str, db: Session = Depends(get_db)):
    unit = db.query(Unit).filter(Unit.uic == uic).first()
    if not unit:
        raise HTTPException(status_code=404, detail=f"Unit {uic} not found")

    gaps = compute_ksb_gaps(db, uic)
    total_billets = db.query(Billet).filter(Billet.unit_uic == uic).count()
    filled = db.query(Assignment).join(Billet).filter(Billet.unit_uic == uic).count()

    return UnitGaps(
        uic=uic,
        unit_name=unit.unit_name,
        gaps=[KsbGap(**g) for g in gaps],
        total_empty_billets=total_billets - filled,
        total_billets=total_billets,
    )

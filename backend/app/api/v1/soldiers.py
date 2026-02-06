from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.soldier import Soldier
from app.schemas.soldier import SoldierRead, SoldierUpdate, IntakeFormSubmission

router = APIRouter(prefix="/soldier", tags=["soldiers"])


@router.get("/{edipi}", response_model=SoldierRead)
def get_soldier(edipi: str, db: Session = Depends(get_db)):
    soldier = db.query(Soldier).filter(Soldier.edipi == edipi).first()
    if not soldier:
        raise HTTPException(status_code=404, detail=f"Soldier {edipi} not found")
    return soldier


@router.patch("/{edipi}", response_model=SoldierRead)
def update_soldier(edipi: str, update: SoldierUpdate, db: Session = Depends(get_db)):
    soldier = db.query(Soldier).filter(Soldier.edipi == edipi).first()
    if not soldier:
        raise HTTPException(status_code=404, detail=f"Soldier {edipi} not found")

    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(soldier, field, value)

    soldier.has_local_override = True
    db.commit()
    db.refresh(soldier)
    return soldier


@router.post("/{edipi}/intake", response_model=SoldierRead)
def submit_intake_form(edipi: str, form: IntakeFormSubmission, db: Session = Depends(get_db)):
    soldier = db.query(Soldier).filter(Soldier.edipi == edipi).first()
    if not soldier:
        raise HTTPException(status_code=404, detail=f"Soldier {edipi} not found")

    form_data = form.model_dump(exclude_unset=True)
    for field, value in form_data.items():
        setattr(soldier, field, value)

    soldier.intake_completed = True
    db.commit()
    db.refresh(soldier)
    return soldier

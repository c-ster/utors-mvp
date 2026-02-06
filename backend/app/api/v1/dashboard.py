from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dashboard import DashboardMetrics
from app.services.dashboard_service import compute_dashboard_metrics

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(
    uic: str = Query(default="W1SF00", description="Unit UIC for dashboard context"),
    db: Session = Depends(get_db),
):
    metrics = compute_dashboard_metrics(db, uic)
    return DashboardMetrics(**metrics)

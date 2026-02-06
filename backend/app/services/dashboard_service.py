"""
Dashboard metrics computation.

Calculates aggregate risk scores, strength gauges, critical alerts,
subunit risk postures, and personnel timelines.
"""

import uuid
from collections import Counter, defaultdict
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.unit import Unit, Billet
from app.models.soldier import Soldier


def _strength_status(pct: float) -> str:
    if pct >= 91:
        return "Green"
    elif pct >= 71:
        return "Amber"
    else:
        return "Red"


def _risk_level_from_score(score: float) -> str:
    if score <= 30:
        return "Green"
    elif score <= 60:
        return "Amber"
    else:
        return "Red"


def compute_unit_strength(db: Session, uic: str) -> dict:
    """Compute strength stats for a unit and all subordinates."""
    unit = db.query(Unit).filter(Unit.uic == uic).first()
    if not unit:
        return {"authorized": 0, "assigned": 0, "percentage": 0, "status": "Red"}

    # Collect all UICs in the hierarchy
    all_uics = _collect_child_uics(db, uic)
    all_uics.add(uic)

    authorized = db.query(Billet).filter(Billet.unit_uic.in_(all_uics)).count()
    assigned = (
        db.query(Soldier)
        .filter(Soldier.unit_uic.in_(all_uics), Soldier.is_outgoing == False)
        .count()
    )

    pct = (assigned / authorized * 100) if authorized > 0 else 0
    return {
        "authorized": authorized,
        "assigned": assigned,
        "percentage": round(pct, 1),
        "status": _strength_status(pct),
    }


def _collect_child_uics(db: Session, parent_uic: str) -> set[str]:
    children = db.query(Unit.uic).filter(Unit.parent_uic == parent_uic).all()
    result = set()
    for (child_uic,) in children:
        result.add(child_uic)
        result |= _collect_child_uics(db, child_uic)
    return result


def compute_ksb_gaps(db: Session, uic: str) -> list[dict]:
    """Identify critical KSB gaps for a unit."""
    all_uics = _collect_child_uics(db, uic)
    all_uics.add(uic)

    billets = db.query(Billet).filter(Billet.unit_uic.in_(all_uics)).all()
    soldiers = (
        db.query(Soldier)
        .filter(Soldier.unit_uic.in_(all_uics), Soldier.is_outgoing == False)
        .all()
    )

    # Count required KSBs across all billets
    ksb_required: Counter = Counter()
    ksb_billets: defaultdict[str, list[str]] = defaultdict(list)
    for b in billets:
        for ksb in (b.critical_ksbs or []):
            ksb_required[ksb] += 1
            ksb_billets[ksb].append(b.position_id)

    # Count available KSBs across all soldiers
    ksb_available: Counter = Counter()
    for s in soldiers:
        for ksb in set(s.ksbs or []):
            ksb_available[ksb] += 1

    gaps = []
    for ksb, req_count in ksb_required.items():
        avail = ksb_available.get(ksb, 0)
        deficit = max(0, req_count - avail)
        if deficit > 0:
            risk = "Red" if avail == 0 else "Amber" if avail < req_count * 0.5 else "Green"
            gaps.append({
                "ksb": ksb,
                "required_count": req_count,
                "current_count": avail,
                "deficit": deficit,
                "affected_billets": ksb_billets[ksb][:5],
                "risk_level": risk,
            })

    gaps.sort(key=lambda g: g["deficit"], reverse=True)
    return gaps


def compute_critical_alerts(db: Session, uic: str) -> list[dict]:
    """Generate the Critical Risk Feed entries."""
    alerts = []
    gaps = compute_ksb_gaps(db, uic)

    for i, gap in enumerate(gaps[:10]):
        severity = "Critical" if gap["current_count"] == 0 else "High"
        unit = db.query(Unit).filter(Unit.uic == uic).first()
        alerts.append({
            "id": str(uuid.uuid4()),
            "severity": severity,
            "title": f"KSB Gap: {gap['ksb']}",
            "description": (
                f"Deficit of {gap['deficit']} personnel with '{gap['ksb']}'. "
                f"Currently {gap['current_count']} of {gap['required_count']} required."
            ),
            "unit_uic": uic,
            "unit_name": unit.unit_name if unit else uic,
            "affected_ksb": gap["ksb"],
        })

    # Add non-deployable alerts
    all_uics = _collect_child_uics(db, uic)
    all_uics.add(uic)
    non_dep = (
        db.query(Soldier)
        .filter(Soldier.unit_uic.in_(all_uics), Soldier.deployable_status == "Red")
        .count()
    )
    if non_dep > 0:
        alerts.append({
            "id": str(uuid.uuid4()),
            "severity": "High" if non_dep > 10 else "Medium",
            "title": f"{non_dep} Non-Deployable Personnel",
            "description": f"{non_dep} soldiers currently flagged as non-deployable across the command.",
            "unit_uic": uic,
            "unit_name": db.query(Unit).filter(Unit.uic == uic).first().unit_name,
            "affected_ksb": None,
        })

    # Outgoing personnel alert
    outgoing = (
        db.query(Soldier)
        .filter(
            Soldier.unit_uic.in_(all_uics),
            Soldier.is_outgoing == True,
            Soldier.projected_loss_date != None,
            Soldier.projected_loss_date <= date.today() + timedelta(days=90),
        )
        .count()
    )
    if outgoing > 0:
        alerts.append({
            "id": str(uuid.uuid4()),
            "severity": "Medium",
            "title": f"{outgoing} Projected Losses (90 days)",
            "description": f"{outgoing} soldiers projected to depart within 90 days.",
            "unit_uic": uic,
            "unit_name": db.query(Unit).filter(Unit.uic == uic).first().unit_name,
            "affected_ksb": None,
        })

    return alerts[:5]


def compute_subunit_risks(db: Session, parent_uic: str) -> list[dict]:
    """Compute risk posture for each direct subordinate unit."""
    children = db.query(Unit).filter(Unit.parent_uic == parent_uic).all()
    results = []

    for child in children:
        strength = compute_unit_strength(db, child.uic)
        gaps = compute_ksb_gaps(db, child.uic)
        critical_gap_count = len([g for g in gaps if g["risk_level"] in ("Red", "Amber")])

        # Risk score: weighted combination of strength deficit + KSB gaps
        strength_risk = max(0, 100 - strength["percentage"])
        gap_risk = min(100, critical_gap_count * 15)
        risk_score = round(strength_risk * 0.6 + gap_risk * 0.4, 1)

        results.append({
            "uic": child.uic,
            "unit_name": child.unit_name,
            "echelon": child.echelon,
            "risk_score": risk_score,
            "risk_level": _risk_level_from_score(risk_score),
            "fill_percentage": strength["percentage"],
            "critical_gaps": critical_gap_count,
            "recently_changed": False,
        })

    results.sort(key=lambda r: r["risk_score"], reverse=True)
    return results


def compute_personnel_timeline(db: Session, uic: str) -> list[dict]:
    """Project gains and losses over the next 90 days in 30-day buckets."""
    all_uics = _collect_child_uics(db, uic)
    all_uics.add(uic)
    today = date.today()
    timeline = []

    for offset_days in [30, 60, 90]:
        cutoff = today + timedelta(days=offset_days)
        prev = today + timedelta(days=offset_days - 30) if offset_days > 30 else today

        losses = (
            db.query(Soldier)
            .filter(
                Soldier.unit_uic.in_(all_uics),
                Soldier.projected_loss_date != None,
                Soldier.projected_loss_date > prev,
                Soldier.projected_loss_date <= cutoff,
            )
            .count()
        )
        gains = (
            db.query(Soldier)
            .filter(
                Soldier.unit_uic.in_(all_uics),
                Soldier.is_incoming == True,
                Soldier.projected_gain_date != None,
                Soldier.projected_gain_date > prev,
                Soldier.projected_gain_date <= cutoff,
            )
            .count()
        )

        timeline.append({
            "date": cutoff.isoformat(),
            "gains": gains,
            "losses": losses,
            "net": gains - losses,
        })

    return timeline


def compute_dashboard_metrics(db: Session, uic: str) -> dict:
    """Compute all dashboard metrics for a given unit."""
    strength = compute_unit_strength(db, uic)
    alerts = compute_critical_alerts(db, uic)
    subunits = compute_subunit_risks(db, uic)
    timeline = compute_personnel_timeline(db, uic)

    all_uics = _collect_child_uics(db, uic)
    all_uics.add(uic)

    # Aggregate risk score
    if subunits:
        avg_risk = sum(s["risk_score"] for s in subunits) / len(subunits)
    else:
        avg_risk = max(0, 100 - strength["percentage"])

    # Talent optimization: ratio of soldiers with KSBs matching their billet
    # Simplified for MVP
    talent_score = max(0, min(100, strength["percentage"] * 0.9))

    incoming = db.query(Soldier).filter(
        Soldier.unit_uic.in_(all_uics), Soldier.is_incoming == True
    ).count()
    outgoing = db.query(Soldier).filter(
        Soldier.unit_uic.in_(all_uics), Soldier.is_outgoing == True
    ).count()
    non_dep = db.query(Soldier).filter(
        Soldier.unit_uic.in_(all_uics), Soldier.deployable_status.in_(["Red", "Amber"])
    ).count()
    at_risk = db.query(Soldier).filter(
        Soldier.unit_uic.in_(all_uics), Soldier.is_outgoing == True
    ).count()

    return {
        "aggregate_risk_score": round(avg_risk, 1),
        "aggregate_risk_level": _risk_level_from_score(avg_risk),
        "strength": strength,
        "talent_optimization_score": round(talent_score, 1),
        "readiness_level": strength["status"],
        "critical_alerts": alerts,
        "subunit_risks": subunits,
        "personnel_timeline": timeline,
        "total_incoming": incoming,
        "total_outgoing": outgoing,
        "at_risk_soldiers": at_risk,
        "non_deployable_count": non_dep,
    }

"""
The "Seating Chart" Algorithm (REQ-4)

Weighted scoring engine for matching soldiers to billets:
  - MTOE Match (Must Have): 55 points
  - Tier 1 KSB Match (Should Have): 25 points
  - Soldier Preference (Nice to Have): 20 points
  Total = 100 for a perfect fit.

Uses a greedy assignment approach: score all soldier-billet pairs,
then assign highest-scoring pairs first, respecting one-to-one constraints.
"""

from app.models.soldier import Soldier
from app.models.unit import Billet

# Rank equivalence map for flexible matching
RANK_TO_GRADE = {
    "PV1": "E1", "PV2": "E2", "PFC": "E3", "SPC": "E4", "CPL": "E4",
    "SGT": "E5", "SSG": "E6", "SFC": "E7", "MSG": "E8", "1SG": "E8",
    "SGM": "E9", "CSM": "E9",
    "2LT": "O1", "1LT": "O2", "CPT": "O3", "MAJ": "O4",
    "LTC": "O5", "COL": "O6",
    "WO1": "W1", "CW2": "W2", "CW3": "W3", "CW4": "W4", "CW5": "W5",
}

GRADE_ORDER = [
    "E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8", "E9",
    "W1", "W2", "W3", "W4", "W5",
    "O1", "O2", "O3", "O4", "O5", "O6",
]


def _grade_index(grade: str) -> int:
    try:
        return GRADE_ORDER.index(grade)
    except ValueError:
        return -1


def _normalize_grade(rank: str) -> str:
    return RANK_TO_GRADE.get(rank, rank)


def score_mtoe_fit(soldier: Soldier, billet: Billet) -> tuple[float, list[str]]:
    """Score the MTOE (rank + MOS) fit. Max 55 points."""
    score = 0.0
    flags = []

    # MOS match (35 points)
    if soldier.mos == billet.required_mos:
        score += 35.0
    elif soldier.asi and soldier.asi == billet.required_mos:
        score += 25.0
        flags.append(f"MOS partial match via ASI ({soldier.asi})")
    else:
        flags.append(f"MOS mismatch: Soldier {soldier.mos} vs Required {billet.required_mos}")

    # Rank/grade match (20 points)
    soldier_grade = _normalize_grade(soldier.rank)
    required_grade = _normalize_grade(billet.required_rank)
    s_idx = _grade_index(soldier_grade)
    r_idx = _grade_index(required_grade)

    if soldier_grade == required_grade:
        score += 20.0
    elif abs(s_idx - r_idx) == 1:
        score += 12.0
        flags.append(f"Rank near-match: {soldier.rank} for {billet.required_rank} slot")
    elif s_idx > r_idx:
        score += 5.0
        flags.append(f"Soldier overqualified: {soldier.rank} for {billet.required_rank} slot")
    else:
        flags.append(f"Rank mismatch: {soldier.rank} for {billet.required_rank} slot")

    return score, flags


def score_talent_fit(soldier: Soldier, billet: Billet) -> tuple[float, list[str]]:
    """Score the KSB/talent match. Max 25 points."""
    if not billet.critical_ksbs:
        return 15.0, []  # No specific KSBs required, baseline credit

    soldier_ksbs = set(soldier.ksbs or [])
    soldier_certs = set(soldier.civilian_certifications or [])
    all_soldier_skills = soldier_ksbs | soldier_certs

    required = set(billet.critical_ksbs)
    matched = required & all_soldier_skills
    flags = []

    if not required:
        return 15.0, []

    match_ratio = len(matched) / len(required)
    score = match_ratio * 25.0

    missing = required - all_soldier_skills
    for ksb in missing:
        flags.append(f"Missing Critical KSB: {ksb}")

    if matched and matched != required:
        cert_matches = matched & soldier_certs
        if cert_matches:
            flags.append(f"Hidden Talent match: {', '.join(cert_matches)}")

    return score, flags


def score_preference_fit(soldier: Soldier, billet: Billet) -> tuple[float, list[str]]:
    """Score soldier preference alignment. Max 20 points."""
    if not soldier.intake_completed:
        return 10.0, []  # Neutral score if no intake data

    score = 10.0  # Base for having completed intake
    flags = []

    # Desired role match
    if soldier.desired_role:
        title_lower = billet.position_title.lower()
        desired_lower = soldier.desired_role.lower()
        if desired_lower in title_lower or title_lower in desired_lower:
            score += 7.0
            flags.append(f"Soldier requested role match: '{soldier.desired_role}'")
        else:
            score += 2.0

    # Career preferences keyword check
    if soldier.career_preferences:
        prefs_lower = soldier.career_preferences.lower()
        if any(kw in prefs_lower for kw in ["leadership", "lead", "command"]):
            if "leader" in billet.position_title.lower() or "commander" in billet.position_title.lower():
                score += 3.0
                flags.append("Career preference aligns with leadership billet")

    return min(score, 20.0), flags


def compute_match(soldier: Soldier, billet: Billet) -> dict:
    """Compute the full match score for a soldier-billet pair."""
    mtoe_score, mtoe_flags = score_mtoe_fit(soldier, billet)
    talent_score, talent_flags = score_talent_fit(soldier, billet)
    pref_score, pref_flags = score_preference_fit(soldier, billet)

    total = mtoe_score + talent_score + pref_score
    all_flags = mtoe_flags + talent_flags + pref_flags

    # Build reasoning string
    reasoning_parts = []
    if mtoe_score >= 50:
        reasoning_parts.append("Strong MOS and rank match")
    elif mtoe_score >= 30:
        reasoning_parts.append("MOS match with rank variance")

    if talent_score >= 20:
        reasoning_parts.append("excellent KSB alignment")
    elif talent_score >= 10:
        reasoning_parts.append("partial KSB coverage")

    if pref_score >= 15:
        reasoning_parts.append("matches soldier's career preferences")

    reasoning = ". ".join(reasoning_parts) + "." if reasoning_parts else "Baseline match."

    return {
        "soldier_edipi": soldier.edipi,
        "soldier_name": f"{soldier.rank} {soldier.last_name}, {soldier.first_name}",
        "soldier_rank": soldier.rank,
        "soldier_mos": soldier.mos,
        "billet_id": str(billet.id),
        "billet_position_title": billet.position_title,
        "billet_required_rank": billet.required_rank,
        "billet_required_mos": billet.required_mos,
        "total_score": round(total, 1),
        "breakdown": {
            "mtoe_fit": round(mtoe_score, 1),
            "talent_fit": round(talent_score, 1),
            "preference_fit": round(pref_score, 1),
        },
        "flags": all_flags,
        "ai_reasoning": reasoning,
    }


def generate_slate(
    soldiers: list[Soldier],
    billets: list[Billet],
) -> dict:
    """
    Run the seating chart algorithm.

    1. Score every eligible soldier against every empty billet.
    2. Sort pairs by total score descending.
    3. Greedily assign highest-scoring pairs (each soldier/billet used once).
    4. Return matches, unslotted soldiers, and unfilled billets.
    """
    # Only consider empty billets
    empty_billets = [b for b in billets if b.assignment is None]
    available_soldiers = list(soldiers)

    if not empty_billets or not available_soldiers:
        return {
            "matches": [],
            "unslotted_soldiers": [s.edipi for s in available_soldiers],
            "unfilled_billets": [str(b.id) for b in empty_billets],
        }

    # Score all pairs
    all_scores: list[dict] = []
    for soldier in available_soldiers:
        for billet in empty_billets:
            match = compute_match(soldier, billet)
            all_scores.append(match)

    # Sort by score descending
    all_scores.sort(key=lambda m: m["total_score"], reverse=True)

    # Greedy assignment
    assigned_soldiers: set[str] = set()
    assigned_billets: set[str] = set()
    matches: list[dict] = []

    for match in all_scores:
        sid = match["soldier_edipi"]
        bid = match["billet_id"]
        if sid not in assigned_soldiers and bid not in assigned_billets:
            matches.append(match)
            assigned_soldiers.add(sid)
            assigned_billets.add(bid)

    unslotted = [s.edipi for s in available_soldiers if s.edipi not in assigned_soldiers]
    unfilled = [str(b.id) for b in empty_billets if str(b.id) not in assigned_billets]

    return {
        "matches": matches,
        "unslotted_soldiers": unslotted,
        "unfilled_billets": unfilled,
    }

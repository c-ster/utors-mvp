"""
Dev-mode authentication bypass.

In development, provides a mock auth middleware that allows impersonating
specific personas via a header. Automatically disabled in production.
"""

from fastapi import Request, HTTPException

from app.core.config import settings

MOCK_USERS = {
    "BN_CMDR_USER": {
        "edipi": "1000000001",
        "name": "COL John Mitchell",
        "rank": "O6",
        "role": "bn_commander",
        "unit_uic": "W1SF00",
        "access_level": "full_hierarchy",
    },
    "CO_CMDR_USER": {
        "edipi": "1000000002",
        "name": "CPT Sarah Chen",
        "rank": "O3",
        "role": "co_commander",
        "unit_uic": "W1SFA0",
        "access_level": "company",
    },
    "S1_USER": {
        "edipi": "1000000003",
        "name": "CPT David Kim",
        "rank": "O3",
        "role": "s1",
        "unit_uic": "W1SF00",
        "access_level": "full_hierarchy",
    },
    "SOLDIER_USER": {
        "edipi": "1000000004",
        "name": "SPC James Wilson",
        "rank": "E4",
        "role": "soldier",
        "unit_uic": "W1SFA1",
        "access_level": "self",
    },
}


async def get_current_user(request: Request) -> dict:
    if settings.ENV == "production":
        raise HTTPException(
            status_code=501,
            detail="CAC/PIV authentication not implemented. Production access denied.",
        )

    persona = request.headers.get("X-Mock-User", "BN_CMDR_USER")
    user = MOCK_USERS.get(persona)
    if not user:
        raise HTTPException(status_code=401, detail=f"Unknown mock persona: {persona}")
    return user

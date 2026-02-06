from fastapi import APIRouter

from app.core.auth import MOCK_USERS

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/personas")
def list_personas():
    """List available mock personas for dev-mode login."""
    return {
        "personas": [
            {"key": k, "name": v["name"], "rank": v["rank"], "role": v["role"]}
            for k, v in MOCK_USERS.items()
        ]
    }


@router.get("/me")
def get_current_user_info():
    """Return the default user info for dev mode."""
    return MOCK_USERS["BN_CMDR_USER"]

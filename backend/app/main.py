from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1 import units, soldiers, slating, dashboard, auth

app = FastAPI(
    title="UTORS - Unit Talent Optimization & Readiness System",
    description="Decision-support tool for personnel readiness and talent management",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(units.router, prefix="/api/v1")
app.include_router(soldiers.router, prefix="/api/v1")
app.include_router(slating.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "system": "UTORS",
        "version": "0.1.0-mvp",
        "status": "operational",
        "env": settings.ENV,
    }


@app.get("/health")
def health():
    return {"status": "ok"}

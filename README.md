# UTORS - Unit Talent Optimization & Readiness System

Decision-support tool for military commanders that links individual talent (Knowledge, Skills, and Behaviors) to unit mission requirements, providing predictive insight into personnel-driven readiness risk.

## Quick Start (Docker)

```bash
# Clone and start all services
docker-compose up --build

# Access:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

The backend will automatically seed the database with a synthetic SF Battalion (~450 personnel) on first startup.

## Local Development

### Backend (Python/FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start PostgreSQL (via Docker or local install)
# Then seed and run:
python seed_data.py
uvicorn app.main:app --reload --port 8000
```

### Frontend (React/Vite/TypeScript)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on port 3000 and proxies API calls to the backend on port 8000.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS v4 |
| Components | shadcn/ui patterns + Lucide icons |
| State | TanStack Query (React Query) |
| Backend | Python 3.11+ + FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 |
| Containerization | Docker + Docker Compose |

## Project Structure

```
utors-mvp/
├── backend/                  # Python/FastAPI
│   ├── app/
│   │   ├── api/v1/           # REST endpoints
│   │   ├── core/             # Config, auth
│   │   ├── db/               # Database session & base
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic (slate engine, dashboard)
│   ├── seed_data.py          # Synthetic data generator
│   └── requirements.txt
├── frontend/                 # React/Vite
│   ├── src/
│   │   ├── components/ui/    # Shared UI components
│   │   ├── features/         # Feature modules
│   │   │   ├── dashboard/    # Commander's Dashboard
│   │   │   ├── slating/      # Slate Generator
│   │   │   ├── roster/       # Unit Roster & Talent
│   │   │   ├── intake/       # Hidden Talent Intake Form
│   │   │   └── wargame/      # What-If Simulation
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # API client, utilities
│   │   └── types/            # TypeScript interfaces
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/unit/{uic}` | Unit details + MTOE structure |
| GET | `/api/v1/unit/{uic}/roster` | Personnel roster with billets |
| GET | `/api/v1/unit/{uic}/gaps` | Critical KSB gaps |
| POST | `/api/v1/slate/generate` | Run slate generation algorithm |
| POST | `/api/v1/slate/commit` | Save proposed assignments |
| GET | `/api/v1/soldier/{edipi}` | Full soldier profile |
| PATCH | `/api/v1/soldier/{edipi}` | Local data override |
| POST | `/api/v1/soldier/{edipi}/intake` | Submit intake form |
| GET | `/api/v1/dashboard/metrics` | Dashboard aggregate metrics |

## Dev Mode Authentication

In development (`ENV=development`), authentication is bypassed with mock personas. Use the persona selector in the sidebar or set the `X-Mock-User` header:

- `BN_CMDR_USER` - Battalion Commander (full access)
- `CO_CMDR_USER` - Company Commander (company-level)
- `S1_USER` - S-1 Staff (full edit access)
- `SOLDIER_USER` - Individual Soldier (self only)

## Synthetic Data Rules

The seed data generates a Special Forces Battalion with:
- **Rule 1 (Crisis):** ~15% of personnel are non-deployable
- **Rule 2 (Hidden Talent):** ~5% of NCOs (SSG-MSG) have high-value hidden skills
- **Rule 3 (Gap):** C Company has ~35% of 18D (SF Medical) slots unfilled

## Slate Algorithm (REQ-4)

Weighted scoring model (100-point scale):
- **MTOE Match (55 pts):** Rank + MOS alignment
- **Talent Match (25 pts):** KSB/certification coverage
- **Preference Match (20 pts):** Soldier career desires + intake data

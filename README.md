# Sentry POC/MAP Portal

A shared web portal for managing Sentry Proof of Concept (POC) and Mutual Action Plan (MAP) documents. Replaces manual Google Sheets workflows with an interactive, collaborative application.

## What It Does

1. **Sentry Staff Portal** - SEs create and manage POC plans, pull Gong call transcripts, and use AI to extract customer value framework insights
2. **Customer Portal** - Customers view their POC plan, confirm their tech stack, track progress, and access relevant Sentry documentation links
3. **AI-Powered Value Framework** - Analyzes Gong call transcripts with Claude to extract current challenges, impact, ideal future state, metrics, and requirements
4. **Auto-Generated Doc Links** - Maps customer tech stack to relevant Sentry SDK documentation and setup guides

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, React Query |
| Backend | Python FastAPI, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 16 |
| AI | Anthropic Claude API |
| External | Gong API (call transcripts) |

## Prerequisites

- **Python 3.11+** (for backend)
- **Node.js 18+** (for frontend)
- **Docker** (for PostgreSQL)
- **Gong API credentials** (optional - for call transcript features)
- **Anthropic API key** (optional - for AI analysis features)

## Quick Start

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e .

# Copy and configure environment
cp ../.env.example .env
# Edit .env with your API keys

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn app.main:app --reload --port 8000
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### 4. Open the App

- **Staff Portal**: http://localhost:3000/staff
- **Customer Portal**: http://localhost:3000/customer/{share_token} (generated when creating a POC)
- **API Docs**: http://localhost:8000/docs (FastAPI Swagger UI)

## Project Structure

```
POC-doc-bot/
├── docker-compose.yml           # PostgreSQL
├── backend/                     # Python FastAPI
│   ├── app/
│   │   ├── main.py             # App entry point
│   │   ├── models/             # SQLAlchemy ORM models (11 tables)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── routers/            # API route handlers (9 routers)
│   │   ├── services/           # Business logic
│   │   │   ├── gong_service.py           # Gong API client
│   │   │   ├── ai_analysis_service.py    # Claude transcript analysis
│   │   │   ├── docs_mapping_service.py   # Tech stack → doc links
│   │   │   └── poc_service.py            # Progress calculations
│   │   └── data/               # Static JSON templates
│   │       ├── sentry_platforms.json     # All Sentry SDK/platform URLs
│   │       ├── default_phases.json       # Default POC phases & tasks
│   │       ├── default_milestones.json   # Default MAP milestones
│   │       └── default_success_criteria.json
│   └── alembic/                # Database migrations
├── frontend/                    # Next.js
│   └── src/
│       ├── app/
│       │   ├── staff/          # SE-facing portal (8 tabs per POC)
│       │   └── customer/       # Customer-facing portal (6 views)
│       ├── components/
│       │   ├── ui/             # shadcn/ui primitives
│       │   └── shared/         # StatusBadge, EditableCell, etc.
│       ├── hooks/              # React Query data hooks
│       └── lib/                # API client, types, constants
```

## Core Workflow

1. **SE creates a POC** → auto-populates default milestones, phases, tasks, and success criteria
2. **SE searches Gong** → finds calls by account domain, fetches transcripts
3. **AI analyzes transcripts** → Claude extracts value framework (challenges, impact, future state, metrics, requirements)
4. **SE reviews and customizes** → edits all sections, sets dates, assigns owners
5. **SE shares with customer** → generates a unique portal link
6. **Customer validates** → confirms tech stack, adds team members, updates status
7. **Doc links auto-generate** → based on confirmed tech stack and success criteria
8. **Both sides track progress** → status dropdowns on every milestone and task

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://poc_user:poc_password@localhost:5432/poc_doc_bot

# Gong API (optional)
GONG_ACCESS_KEY=your_key
GONG_ACCESS_KEY_SECRET=your_secret

# Anthropic Claude API (optional)
ANTHROPIC_API_KEY=your_key
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## API Endpoints

The backend exposes ~50 REST endpoints organized by domain:

| Prefix | Description |
|--------|------------|
| `GET/POST/PATCH /api/v1/pocs` | POC CRUD |
| `/api/v1/pocs/{id}/milestones` | Mutual Action Plan |
| `/api/v1/pocs/{id}/phases` | POC phases & tasks |
| `/api/v1/pocs/{id}/success-criteria` | Success criteria |
| `/api/v1/pocs/{id}/team` | Team members |
| `/api/v1/pocs/{id}/gong` | Gong call search & transcripts |
| `/api/v1/pocs/{id}/ai` | AI analysis trigger & results |
| `/api/v1/pocs/{id}/tech-stack` | Tech stack & doc link generation |
| `/api/v1/customer/{token}` | Customer portal (all read + limited write) |

## Key Features

- **Inline editing** - Click any cell to edit, auto-saves on blur
- **Status tracking** - Not Started / In Progress / Completed dropdowns everywhere
- **Progress bars** - Per-phase and overall completion percentages
- **AI extraction** - Claude analyzes call transcripts with evidence quotes and confidence scores
- **Doc link generation** - Maps 17+ Sentry platforms and 50+ frameworks to documentation URLs
- **Shareable portal** - Customers access via unique token link, no login required
- **Default templates** - New POCs pre-populated with standard milestones, phases, and criteria

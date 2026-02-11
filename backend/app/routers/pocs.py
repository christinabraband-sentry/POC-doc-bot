import json
import secrets
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.poc import POC, ValueFramework
from app.models.mutual_action_plan import Milestone
from app.models.phase import Phase, Task
from app.models.success_criteria import SuccessCriterion
from app.schemas.poc import (
    POCCreate,
    POCProgress,
    POCResponse,
    POCSummary,
    POCUpdate,
)

router = APIRouter(prefix="/pocs", tags=["pocs"])

DATA_DIR = Path(__file__).parent.parent / "data"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _calculate_progress(db: Session, poc_id: uuid.UUID) -> POCProgress:
    """Return progress stats for a single POC based on task completion."""
    tasks = db.query(Task).filter(Task.poc_id == poc_id).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == "completed")
    pct = round((completed / total) * 100, 1) if total > 0 else 0.0
    return POCProgress(total_tasks=total, completed_tasks=completed, completion_pct=pct)


def _get_poc_or_404(poc_id: uuid.UUID, db: Session) -> POC:
    poc = db.query(POC).filter(POC.id == poc_id).first()
    if not poc:
        raise HTTPException(status_code=404, detail="POC not found")
    return poc


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=list[POCSummary])
def list_pocs(
    status: Optional[str] = Query(None, description="Filter by POC status"),
    db: Session = Depends(get_db),
):
    """List all POCs with optional status filter. Returns lightweight summaries."""
    query = db.query(POC)
    if status:
        query = query.filter(POC.status == status)
    pocs = query.order_by(POC.created_at.desc()).all()

    results: list[POCSummary] = []
    for poc in pocs:
        progress = _calculate_progress(db, poc.id)
        summary = POCSummary.model_validate(poc)
        summary.progress = progress
        results.append(summary)
    return results


@router.post("", response_model=POCResponse, status_code=201)
def create_poc(payload: POCCreate, db: Session = Depends(get_db)):
    """Create a new POC with default milestones, phases/tasks, and success criteria."""
    poc = POC(
        account_name=payload.account_name,
        account_domain=payload.account_domain,
        opportunity_name=payload.opportunity_name,
        poc_start_date=payload.poc_start_date,
        poc_end_date=payload.poc_end_date,
        notes=payload.notes,
        share_token=secrets.token_urlsafe(32),
        status="draft",
    )
    db.add(poc)
    db.flush()  # assigns poc.id

    # Create empty ValueFramework
    vf = ValueFramework(poc_id=poc.id)
    db.add(vf)

    # Load and create default milestones
    milestones_path = DATA_DIR / "default_milestones.json"
    if milestones_path.exists():
        milestones_data = json.loads(milestones_path.read_text())
        for m in milestones_data:
            milestone = Milestone(
                poc_id=poc.id,
                title=m["title"],
                description=m.get("description", ""),
                sort_order=m.get("sort_order", 0),
            )
            db.add(milestone)

    # Load and create default success criteria
    criteria_path = DATA_DIR / "default_success_criteria.json"
    if criteria_path.exists():
        criteria_data = json.loads(criteria_path.read_text())
        for c in criteria_data:
            criterion = SuccessCriterion(
                poc_id=poc.id,
                feature=c["feature"],
                priority=c.get("priority"),
                criteria=c.get("criteria"),
                current_state=c.get("current_state"),
                notes=c.get("notes"),
                sort_order=c.get("sort_order", 0),
            )
            db.add(criterion)

    # Load and create default phases with tasks
    phases_path = DATA_DIR / "default_phases.json"
    if phases_path.exists():
        phases_data = json.loads(phases_path.read_text())
        for p in phases_data:
            phase = Phase(
                poc_id=poc.id,
                name=p["title"],
                description=p.get("description", ""),
                sort_order=p.get("phase_number", 0),
            )
            db.add(phase)
            db.flush()  # assigns phase.id

            for t in p.get("tasks", []):
                task = Task(
                    poc_id=poc.id,
                    phase_id=phase.id,
                    title=t["title"],
                    resource_url=t.get("resource_url"),
                    resource_label=t.get("resource_label"),
                    is_optional=t.get("is_optional", False),
                    sort_order=t.get("sort_order", 0),
                )
                db.add(task)

    db.commit()
    db.refresh(poc)

    progress = _calculate_progress(db, poc.id)
    response = POCResponse.model_validate(poc)
    response.progress = progress
    return response


@router.get("/{poc_id}", response_model=POCResponse)
def get_poc(poc_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get full POC details including value_framework and progress."""
    poc = _get_poc_or_404(poc_id, db)
    progress = _calculate_progress(db, poc.id)
    response = POCResponse.model_validate(poc)
    response.progress = progress
    return response


@router.patch("/{poc_id}", response_model=POCResponse)
def update_poc(poc_id: uuid.UUID, payload: POCUpdate, db: Session = Depends(get_db)):
    """Update POC fields (status, dates, notes, account_name, etc.)."""
    poc = _get_poc_or_404(poc_id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(poc, field, value)

    db.commit()
    db.refresh(poc)

    progress = _calculate_progress(db, poc.id)
    response = POCResponse.model_validate(poc)
    response.progress = progress
    return response


@router.delete("/{poc_id}", response_model=POCResponse)
def delete_poc(poc_id: uuid.UUID, db: Session = Depends(get_db)):
    """Soft delete: set POC status to 'archived'."""
    poc = _get_poc_or_404(poc_id, db)
    poc.status = "archived"
    db.commit()
    db.refresh(poc)

    progress = _calculate_progress(db, poc.id)
    response = POCResponse.model_validate(poc)
    response.progress = progress
    return response

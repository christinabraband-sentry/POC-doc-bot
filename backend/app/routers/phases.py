import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.poc import POC
from app.models.phase import Phase, Task
from app.schemas.phase import (
    PhaseCreate,
    PhaseResponse,
    PhaseUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)

router = APIRouter(prefix="/pocs/{poc_id}", tags=["phases"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_poc_or_404(poc_id: uuid.UUID, db: Session) -> POC:
    poc = db.query(POC).filter(POC.id == poc_id).first()
    if not poc:
        raise HTTPException(status_code=404, detail="POC not found")
    return poc


def _get_phase_or_404(poc_id: uuid.UUID, phase_id: uuid.UUID, db: Session) -> Phase:
    phase = (
        db.query(Phase)
        .filter(Phase.id == phase_id, Phase.poc_id == poc_id)
        .first()
    )
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    return phase


def _get_task_or_404(poc_id: uuid.UUID, task_id: uuid.UUID, db: Session) -> Task:
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.poc_id == poc_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# ---------------------------------------------------------------------------
# Phase endpoints
# ---------------------------------------------------------------------------

@router.get("/phases", response_model=list[PhaseResponse])
def list_phases(poc_id: uuid.UUID, db: Session = Depends(get_db)):
    """List phases with nested tasks, ordered by sort_order."""
    _get_poc_or_404(poc_id, db)
    phases = (
        db.query(Phase)
        .filter(Phase.poc_id == poc_id)
        .order_by(Phase.sort_order)
        .all()
    )
    return phases


@router.post("/phases", response_model=PhaseResponse, status_code=201)
def create_phase(
    poc_id: uuid.UUID,
    payload: PhaseCreate,
    db: Session = Depends(get_db),
):
    """Create a new phase for a POC."""
    _get_poc_or_404(poc_id, db)
    phase = Phase(
        poc_id=poc_id,
        name=payload.name,
        description=payload.description,
        sort_order=payload.sort_order or 0,
    )
    db.add(phase)
    db.commit()
    db.refresh(phase)
    return phase


@router.patch("/phases/{phase_id}", response_model=PhaseResponse)
def update_phase(
    poc_id: uuid.UUID,
    phase_id: uuid.UUID,
    payload: PhaseUpdate,
    db: Session = Depends(get_db),
):
    """Update a phase."""
    phase = _get_phase_or_404(poc_id, phase_id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(phase, field, value)

    db.commit()
    db.refresh(phase)
    return phase


@router.delete("/phases/{phase_id}", status_code=204)
def delete_phase(
    poc_id: uuid.UUID,
    phase_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Delete a phase and all its tasks (cascade)."""
    phase = _get_phase_or_404(poc_id, phase_id, db)
    db.delete(phase)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Task endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/phases/{phase_id}/tasks", response_model=TaskResponse, status_code=201
)
def create_task(
    poc_id: uuid.UUID,
    phase_id: uuid.UUID,
    payload: TaskCreate,
    db: Session = Depends(get_db),
):
    """Create a task in a specific phase."""
    _get_poc_or_404(poc_id, db)
    _get_phase_or_404(poc_id, phase_id, db)

    task = Task(
        poc_id=poc_id,
        phase_id=phase_id,
        title=payload.title,
        resource_url=payload.resource_url,
        resource_label=payload.resource_label,
        owner=payload.owner,
        target_date=payload.target_date,
        status=payload.status or "not_started",
        notes=payload.notes,
        is_optional=payload.is_optional,
        sort_order=payload.sort_order or 0,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    poc_id: uuid.UUID,
    task_id: uuid.UUID,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
):
    """Update a task (status, owner, date, notes, etc.)."""
    task = _get_task_or_404(poc_id, task_id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(
    poc_id: uuid.UUID,
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Delete a task."""
    task = _get_task_or_404(poc_id, task_id, db)
    db.delete(task)
    db.commit()
    return None

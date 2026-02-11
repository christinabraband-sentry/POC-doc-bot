import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.poc import POC
from app.models.mutual_action_plan import Milestone
from app.schemas.mutual_action_plan import (
    MilestoneCreate,
    MilestoneResponse,
    MilestoneUpdate,
)

router = APIRouter(prefix="/pocs/{poc_id}/milestones", tags=["milestones"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_poc_or_404(poc_id: uuid.UUID, db: Session) -> POC:
    poc = db.query(POC).filter(POC.id == poc_id).first()
    if not poc:
        raise HTTPException(status_code=404, detail="POC not found")
    return poc


def _get_milestone_or_404(
    poc_id: uuid.UUID, milestone_id: uuid.UUID, db: Session
) -> Milestone:
    milestone = (
        db.query(Milestone)
        .filter(Milestone.id == milestone_id, Milestone.poc_id == poc_id)
        .first()
    )
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    return milestone


# ---------------------------------------------------------------------------
# Reorder request body
# ---------------------------------------------------------------------------

class ReorderRequest(BaseModel):
    ordered_ids: list[uuid.UUID]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=list[MilestoneResponse])
def list_milestones(poc_id: uuid.UUID, db: Session = Depends(get_db)):
    """List all milestones for a POC, ordered by sort_order."""
    _get_poc_or_404(poc_id, db)
    milestones = (
        db.query(Milestone)
        .filter(Milestone.poc_id == poc_id)
        .order_by(Milestone.sort_order)
        .all()
    )
    return milestones


@router.post("", response_model=MilestoneResponse, status_code=201)
def create_milestone(
    poc_id: uuid.UUID,
    payload: MilestoneCreate,
    db: Session = Depends(get_db),
):
    """Create a new milestone for a POC."""
    _get_poc_or_404(poc_id, db)
    milestone = Milestone(
        poc_id=poc_id,
        title=payload.title,
        due_date=payload.due_date,
        description=payload.description,
        notes=payload.notes,
        status=payload.status or "not_started",
        sort_order=payload.sort_order or 0,
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.patch("/{milestone_id}", response_model=MilestoneResponse)
def update_milestone(
    poc_id: uuid.UUID,
    milestone_id: uuid.UUID,
    payload: MilestoneUpdate,
    db: Session = Depends(get_db),
):
    """Update a milestone."""
    milestone = _get_milestone_or_404(poc_id, milestone_id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(milestone, field, value)

    db.commit()
    db.refresh(milestone)
    return milestone


@router.delete("/{milestone_id}", status_code=204)
def delete_milestone(
    poc_id: uuid.UUID,
    milestone_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Delete a milestone."""
    milestone = _get_milestone_or_404(poc_id, milestone_id, db)
    db.delete(milestone)
    db.commit()
    return None


@router.patch("/reorder", response_model=list[MilestoneResponse])
def reorder_milestones(
    poc_id: uuid.UUID,
    payload: ReorderRequest,
    db: Session = Depends(get_db),
):
    """Reorder milestones by providing an ordered list of milestone IDs."""
    _get_poc_or_404(poc_id, db)
    milestones = (
        db.query(Milestone).filter(Milestone.poc_id == poc_id).all()
    )
    milestone_map = {m.id: m for m in milestones}

    for idx, mid in enumerate(payload.ordered_ids):
        if mid not in milestone_map:
            raise HTTPException(
                status_code=400,
                detail=f"Milestone {mid} not found in this POC",
            )
        milestone_map[mid].sort_order = idx

    db.commit()

    updated = (
        db.query(Milestone)
        .filter(Milestone.poc_id == poc_id)
        .order_by(Milestone.sort_order)
        .all()
    )
    return updated

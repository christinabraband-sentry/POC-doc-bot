import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.poc import POC
from app.models.success_criteria import SuccessCriterion
from app.schemas.success_criteria import (
    SuccessCriterionCreate,
    SuccessCriterionResponse,
    SuccessCriterionUpdate,
)

router = APIRouter(prefix="/pocs/{poc_id}/success-criteria", tags=["success-criteria"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_poc_or_404(poc_id: uuid.UUID, db: Session) -> POC:
    poc = db.query(POC).filter(POC.id == poc_id).first()
    if not poc:
        raise HTTPException(status_code=404, detail="POC not found")
    return poc


def _get_criterion_or_404(
    poc_id: uuid.UUID, criterion_id: uuid.UUID, db: Session
) -> SuccessCriterion:
    criterion = (
        db.query(SuccessCriterion)
        .filter(SuccessCriterion.id == criterion_id, SuccessCriterion.poc_id == poc_id)
        .first()
    )
    if not criterion:
        raise HTTPException(status_code=404, detail="Success criterion not found")
    return criterion


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=list[SuccessCriterionResponse])
def list_success_criteria(poc_id: uuid.UUID, db: Session = Depends(get_db)):
    """List all success criteria for a POC, ordered by sort_order."""
    _get_poc_or_404(poc_id, db)
    criteria = (
        db.query(SuccessCriterion)
        .filter(SuccessCriterion.poc_id == poc_id)
        .order_by(SuccessCriterion.sort_order)
        .all()
    )
    return criteria


@router.post("", response_model=SuccessCriterionResponse, status_code=201)
def create_success_criterion(
    poc_id: uuid.UUID,
    payload: SuccessCriterionCreate,
    db: Session = Depends(get_db),
):
    """Create a new success criterion for a POC."""
    _get_poc_or_404(poc_id, db)
    criterion = SuccessCriterion(
        poc_id=poc_id,
        feature=payload.feature,
        priority=payload.priority,
        criteria=payload.criteria,
        current_state=payload.current_state,
        notes=payload.notes,
        sort_order=payload.sort_order or 0,
    )
    db.add(criterion)
    db.commit()
    db.refresh(criterion)
    return criterion


@router.patch("/{criterion_id}", response_model=SuccessCriterionResponse)
def update_success_criterion(
    poc_id: uuid.UUID,
    criterion_id: uuid.UUID,
    payload: SuccessCriterionUpdate,
    db: Session = Depends(get_db),
):
    """Update a success criterion."""
    criterion = _get_criterion_or_404(poc_id, criterion_id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(criterion, field, value)

    db.commit()
    db.refresh(criterion)
    return criterion


@router.delete("/{criterion_id}", status_code=204)
def delete_success_criterion(
    poc_id: uuid.UUID,
    criterion_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Delete a success criterion."""
    criterion = _get_criterion_or_404(poc_id, criterion_id, db)
    db.delete(criterion)
    db.commit()
    return None

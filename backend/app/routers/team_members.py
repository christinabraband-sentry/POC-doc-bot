import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.poc import POC
from app.models.team_member import TeamMember
from app.schemas.team_member import (
    TeamMemberCreate,
    TeamMemberResponse,
    TeamMemberUpdate,
)

router = APIRouter(prefix="/pocs/{poc_id}/team", tags=["team-members"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_poc_or_404(poc_id: uuid.UUID, db: Session) -> POC:
    poc = db.query(POC).filter(POC.id == poc_id).first()
    if not poc:
        raise HTTPException(status_code=404, detail="POC not found")
    return poc


def _get_member_or_404(
    poc_id: uuid.UUID, member_id: uuid.UUID, db: Session
) -> TeamMember:
    member = (
        db.query(TeamMember)
        .filter(TeamMember.id == member_id, TeamMember.poc_id == poc_id)
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return member


# ---------------------------------------------------------------------------
# Response model for grouped team members
# ---------------------------------------------------------------------------

from pydantic import BaseModel


class GroupedTeamResponse(BaseModel):
    sentry: list[TeamMemberResponse] = []
    customer: list[TeamMemberResponse] = []


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=GroupedTeamResponse)
def list_team_members(poc_id: uuid.UUID, db: Session = Depends(get_db)):
    """List all team members grouped by team_side (sentry / customer)."""
    _get_poc_or_404(poc_id, db)
    members = (
        db.query(TeamMember)
        .filter(TeamMember.poc_id == poc_id)
        .order_by(TeamMember.sort_order)
        .all()
    )

    sentry_members = [m for m in members if m.team_side == "sentry"]
    customer_members = [m for m in members if m.team_side == "customer"]

    return GroupedTeamResponse(
        sentry=[TeamMemberResponse.model_validate(m) for m in sentry_members],
        customer=[TeamMemberResponse.model_validate(m) for m in customer_members],
    )


@router.post("", response_model=TeamMemberResponse, status_code=201)
def create_team_member(
    poc_id: uuid.UUID,
    payload: TeamMemberCreate,
    db: Session = Depends(get_db),
):
    """Add a team member to a POC."""
    _get_poc_or_404(poc_id, db)
    member = TeamMember(
        poc_id=poc_id,
        team_side=payload.team_side,
        name=payload.name,
        role=payload.role,
        email=payload.email,
        is_primary_contact=payload.is_primary_contact,
        sort_order=payload.sort_order or 0,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.patch("/{member_id}", response_model=TeamMemberResponse)
def update_team_member(
    poc_id: uuid.UUID,
    member_id: uuid.UUID,
    payload: TeamMemberUpdate,
    db: Session = Depends(get_db),
):
    """Update a team member."""
    member = _get_member_or_404(poc_id, member_id, db)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(member, field, value)

    db.commit()
    db.refresh(member)
    return member


@router.delete("/{member_id}", status_code=204)
def delete_team_member(
    poc_id: uuid.UUID,
    member_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Remove a team member from a POC."""
    member = _get_member_or_404(poc_id, member_id, db)
    db.delete(member)
    db.commit()
    return None

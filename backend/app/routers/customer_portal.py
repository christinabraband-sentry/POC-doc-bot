import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.poc import POC, ValueFramework
from app.models.mutual_action_plan import Milestone
from app.models.phase import Phase, Task
from app.models.success_criteria import SuccessCriterion
from app.models.team_member import TeamMember
from app.models.tech_stack import TechStackEntry, DocLink
from app.schemas.poc import (
    POCProgress,
    POCSummary,
    ValueFrameworkResponse,
)
from app.schemas.mutual_action_plan import MilestoneResponse
from app.schemas.phase import PhaseResponse, TaskResponse
from app.schemas.success_criteria import SuccessCriterionResponse
from app.schemas.team_member import TeamMemberCreate, TeamMemberResponse
from app.schemas.tech_stack import (
    DocLinkResponse,
    TechStackEntryCreate,
    TechStackEntryResponse,
)

router = APIRouter(prefix="/customer", tags=["customer-portal"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_poc_by_token(share_token: str, db: Session) -> POC:
    poc = db.query(POC).filter(POC.share_token == share_token).first()
    if not poc:
        raise HTTPException(status_code=404, detail="POC not found")
    return poc


def _calculate_progress(db: Session, poc_id: uuid.UUID) -> POCProgress:
    tasks = db.query(Task).filter(Task.poc_id == poc_id).all()
    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == "completed")
    pct = round((completed / total) * 100, 1) if total > 0 else 0.0
    return POCProgress(total_tasks=total, completed_tasks=completed, completion_pct=pct)


# ---------------------------------------------------------------------------
# Customer-limited update schemas
# ---------------------------------------------------------------------------

class CustomerMilestoneUpdate(BaseModel):
    notes: Optional[str] = None
    status: Optional[str] = None


class CustomerTaskUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class CustomerCriterionUpdate(BaseModel):
    current_state: Optional[str] = None
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Grouped team response (re-used from team_members)
# ---------------------------------------------------------------------------

class GroupedTeamResponse(BaseModel):
    sentry: list[TeamMemberResponse] = []
    customer: list[TeamMemberResponse] = []


# ---------------------------------------------------------------------------
# POC Summary & Value Framework
# ---------------------------------------------------------------------------

@router.get("/{share_token}", response_model=POCSummary)
def get_customer_poc_summary(share_token: str, db: Session = Depends(get_db)):
    """Get POC summary via share token."""
    poc = get_poc_by_token(share_token, db)
    progress = _calculate_progress(db, poc.id)
    summary = POCSummary.model_validate(poc)
    summary.progress = progress
    return summary


@router.get("/{share_token}/value-framework", response_model=Optional[ValueFrameworkResponse])
def get_customer_value_framework(share_token: str, db: Session = Depends(get_db)):
    """Get the value framework for a POC."""
    poc = get_poc_by_token(share_token, db)
    vf = db.query(ValueFramework).filter(ValueFramework.poc_id == poc.id).first()
    if not vf:
        return None
    return vf


# ---------------------------------------------------------------------------
# Milestones
# ---------------------------------------------------------------------------

@router.get("/{share_token}/milestones", response_model=list[MilestoneResponse])
def get_customer_milestones(share_token: str, db: Session = Depends(get_db)):
    """Get milestones for a POC."""
    poc = get_poc_by_token(share_token, db)
    milestones = (
        db.query(Milestone)
        .filter(Milestone.poc_id == poc.id)
        .order_by(Milestone.sort_order)
        .all()
    )
    return milestones


@router.patch(
    "/{share_token}/milestones/{milestone_id}",
    response_model=MilestoneResponse,
)
def update_customer_milestone(
    share_token: str,
    milestone_id: uuid.UUID,
    payload: CustomerMilestoneUpdate,
    db: Session = Depends(get_db),
):
    """Update a milestone (limited to notes and status)."""
    poc = get_poc_by_token(share_token, db)
    milestone = (
        db.query(Milestone)
        .filter(Milestone.id == milestone_id, Milestone.poc_id == poc.id)
        .first()
    )
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(milestone, field, value)

    db.commit()
    db.refresh(milestone)
    return milestone


# ---------------------------------------------------------------------------
# Phases & Tasks
# ---------------------------------------------------------------------------

@router.get("/{share_token}/phases", response_model=list[PhaseResponse])
def get_customer_phases(share_token: str, db: Session = Depends(get_db)):
    """Get phases with nested tasks."""
    poc = get_poc_by_token(share_token, db)
    phases = (
        db.query(Phase)
        .filter(Phase.poc_id == poc.id)
        .order_by(Phase.sort_order)
        .all()
    )
    return phases


@router.patch(
    "/{share_token}/tasks/{task_id}",
    response_model=TaskResponse,
)
def update_customer_task(
    share_token: str,
    task_id: uuid.UUID,
    payload: CustomerTaskUpdate,
    db: Session = Depends(get_db),
):
    """Update a task (limited to status and notes)."""
    poc = get_poc_by_token(share_token, db)
    task = (
        db.query(Task)
        .filter(Task.id == task_id, Task.poc_id == poc.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


# ---------------------------------------------------------------------------
# Success Criteria
# ---------------------------------------------------------------------------

@router.get(
    "/{share_token}/success-criteria",
    response_model=list[SuccessCriterionResponse],
)
def get_customer_success_criteria(share_token: str, db: Session = Depends(get_db)):
    """Get success criteria for a POC."""
    poc = get_poc_by_token(share_token, db)
    criteria = (
        db.query(SuccessCriterion)
        .filter(SuccessCriterion.poc_id == poc.id)
        .order_by(SuccessCriterion.sort_order)
        .all()
    )
    return criteria


@router.patch(
    "/{share_token}/success-criteria/{criterion_id}",
    response_model=SuccessCriterionResponse,
)
def update_customer_criterion(
    share_token: str,
    criterion_id: uuid.UUID,
    payload: CustomerCriterionUpdate,
    db: Session = Depends(get_db),
):
    """Update a success criterion (limited to current_state and notes)."""
    poc = get_poc_by_token(share_token, db)
    criterion = (
        db.query(SuccessCriterion)
        .filter(SuccessCriterion.id == criterion_id, SuccessCriterion.poc_id == poc.id)
        .first()
    )
    if not criterion:
        raise HTTPException(status_code=404, detail="Success criterion not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(criterion, field, value)

    db.commit()
    db.refresh(criterion)
    return criterion


# ---------------------------------------------------------------------------
# Tech Stack
# ---------------------------------------------------------------------------

@router.get("/{share_token}/tech-stack", response_model=list[TechStackEntryResponse])
def get_customer_tech_stack(share_token: str, db: Session = Depends(get_db)):
    """Get tech stack entries with doc links."""
    poc = get_poc_by_token(share_token, db)
    entries = (
        db.query(TechStackEntry)
        .filter(TechStackEntry.poc_id == poc.id)
        .order_by(TechStackEntry.category, TechStackEntry.name)
        .all()
    )
    return entries


@router.post(
    "/{share_token}/tech-stack",
    response_model=TechStackEntryResponse,
    status_code=201,
)
def create_customer_tech_stack_entry(
    share_token: str,
    payload: TechStackEntryCreate,
    db: Session = Depends(get_db),
):
    """Add a tech stack entry (customer-facing)."""
    poc = get_poc_by_token(share_token, db)
    entry = TechStackEntry(
        poc_id=poc.id,
        category=payload.category,
        name=payload.name,
        sentry_platform_key=payload.sentry_platform_key,
        confirmed_by_customer=payload.confirmed_by_customer,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch(
    "/{share_token}/tech-stack/{entry_id}/confirm",
    response_model=TechStackEntryResponse,
)
def confirm_customer_tech_stack_entry(
    share_token: str,
    entry_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Confirm a tech stack entry."""
    poc = get_poc_by_token(share_token, db)
    entry = (
        db.query(TechStackEntry)
        .filter(TechStackEntry.id == entry_id, TechStackEntry.poc_id == poc.id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Tech stack entry not found")

    entry.confirmed_by_customer = True
    db.commit()
    db.refresh(entry)
    return entry


# ---------------------------------------------------------------------------
# Doc Links
# ---------------------------------------------------------------------------

@router.get("/{share_token}/doc-links", response_model=list[DocLinkResponse])
def get_customer_doc_links(share_token: str, db: Session = Depends(get_db)):
    """Get generated doc links for a POC."""
    poc = get_poc_by_token(share_token, db)
    links = (
        db.query(DocLink)
        .filter(DocLink.poc_id == poc.id)
        .order_by(DocLink.sort_order)
        .all()
    )
    return links


# ---------------------------------------------------------------------------
# Team
# ---------------------------------------------------------------------------

@router.get("/{share_token}/team", response_model=GroupedTeamResponse)
def get_customer_team(share_token: str, db: Session = Depends(get_db)):
    """Get the team roster grouped by side."""
    poc = get_poc_by_token(share_token, db)
    members = (
        db.query(TeamMember)
        .filter(TeamMember.poc_id == poc.id)
        .order_by(TeamMember.sort_order)
        .all()
    )

    sentry_members = [m for m in members if m.team_side == "sentry"]
    customer_members = [m for m in members if m.team_side == "customer"]

    return GroupedTeamResponse(
        sentry=[TeamMemberResponse.model_validate(m) for m in sentry_members],
        customer=[TeamMemberResponse.model_validate(m) for m in customer_members],
    )


@router.post(
    "/{share_token}/team",
    response_model=TeamMemberResponse,
    status_code=201,
)
def create_customer_team_member(
    share_token: str,
    payload: TeamMemberCreate,
    db: Session = Depends(get_db),
):
    """Add a customer team member. team_side is forced to 'customer'."""
    poc = get_poc_by_token(share_token, db)
    member = TeamMember(
        poc_id=poc.id,
        team_side="customer",  # forced
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

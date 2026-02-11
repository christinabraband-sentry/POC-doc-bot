import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Milestone
# ---------------------------------------------------------------------------

class MilestoneBase(BaseModel):
    title: str = Field(..., max_length=500)
    due_date: Optional[date] = None
    description: Optional[str] = None
    notes: Optional[str] = None


class MilestoneCreate(MilestoneBase):
    """Required: title. Everything else is optional."""
    status: Optional[str] = Field("not_started", max_length=50)
    sort_order: Optional[int] = 0


class MilestoneUpdate(BaseModel):
    """PATCH-friendly: every field is optional."""
    title: Optional[str] = Field(None, max_length=500)
    due_date: Optional[date] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)
    sort_order: Optional[int] = None


class MilestoneResponse(MilestoneBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    poc_id: uuid.UUID
    status: str
    sort_order: int
    created_at: datetime
    updated_at: datetime

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------

class TaskBase(BaseModel):
    title: str = Field(..., max_length=500)
    resource_url: Optional[str] = Field(None, max_length=1000)
    resource_label: Optional[str] = Field(None, max_length=255)
    owner: Optional[str] = Field(None, max_length=255)
    target_date: Optional[date] = None
    notes: Optional[str] = None
    is_optional: bool = False


class TaskCreate(TaskBase):
    """Required: title. phase_id is typically supplied via the URL path."""
    phase_id: Optional[uuid.UUID] = None
    status: Optional[str] = Field("not_started", max_length=50)
    sort_order: Optional[int] = 0


class TaskUpdate(BaseModel):
    """PATCH-friendly: every field is optional."""
    title: Optional[str] = Field(None, max_length=500)
    phase_id: Optional[uuid.UUID] = None
    resource_url: Optional[str] = Field(None, max_length=1000)
    resource_label: Optional[str] = Field(None, max_length=255)
    owner: Optional[str] = Field(None, max_length=255)
    target_date: Optional[date] = None
    status: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None
    is_optional: Optional[bool] = None
    sort_order: Optional[int] = None


class TaskResponse(TaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    phase_id: uuid.UUID
    poc_id: uuid.UUID
    status: str
    sort_order: int
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Phase
# ---------------------------------------------------------------------------

class PhaseBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None


class PhaseCreate(PhaseBase):
    """Required: name."""
    sort_order: Optional[int] = 0


class PhaseUpdate(BaseModel):
    """PATCH-friendly: every field is optional."""
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    sort_order: Optional[int] = None


class PhaseResponse(PhaseBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    poc_id: uuid.UUID
    sort_order: int
    created_at: datetime
    updated_at: datetime

    tasks: list[TaskResponse] = []

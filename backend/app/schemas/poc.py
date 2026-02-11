import uuid
from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# ValueFramework
# ---------------------------------------------------------------------------

class ValueFrameworkBase(BaseModel):
    current_challenges: Optional[str] = None
    impact: Optional[str] = None
    ideal_future_state: Optional[str] = None
    everyday_metrics: Optional[str] = None
    core_requirements: Optional[str] = None


class ValueFrameworkCreate(ValueFrameworkBase):
    """All fields optional -- the framework is typically filled in over time."""
    pass


class ValueFrameworkUpdate(BaseModel):
    """PATCH-friendly: every field is optional."""
    current_challenges: Optional[str] = None
    impact: Optional[str] = None
    ideal_future_state: Optional[str] = None
    everyday_metrics: Optional[str] = None
    core_requirements: Optional[str] = None


class ValueFrameworkResponse(ValueFrameworkBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    poc_id: uuid.UUID
    ai_generated: bool = False
    ai_confidence_score: Optional[float] = None
    source_call_ids: Optional[list[str]] = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# POC - progress helpers
# ---------------------------------------------------------------------------

class POCProgress(BaseModel):
    """Lightweight progress summary embedded in POCResponse / POCSummary."""
    total_tasks: int = 0
    completed_tasks: int = 0
    completion_pct: float = 0.0


# ---------------------------------------------------------------------------
# POC
# ---------------------------------------------------------------------------

class POCBase(BaseModel):
    account_name: str = Field(..., max_length=255)
    account_domain: Optional[str] = Field(None, max_length=255)
    opportunity_name: Optional[str] = Field(None, max_length=255)


class POCCreate(POCBase):
    """Required: account_name. Everything else is optional."""
    poc_start_date: Optional[date] = None
    poc_end_date: Optional[date] = None
    notes: Optional[str] = None


class POCUpdate(BaseModel):
    """PATCH-friendly: every field is optional."""
    account_name: Optional[str] = Field(None, max_length=255)
    account_domain: Optional[str] = Field(None, max_length=255)
    opportunity_name: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, max_length=50)
    poc_start_date: Optional[date] = None
    poc_end_date: Optional[date] = None
    notes: Optional[str] = None


class POCResponse(POCBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    share_token: str
    status: str
    poc_start_date: Optional[date] = None
    poc_end_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Nested objects
    value_framework: Optional[ValueFrameworkResponse] = None
    progress: Optional[POCProgress] = None


class POCSummary(BaseModel):
    """Lighter schema used for list endpoints."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account_name: str
    status: str
    created_at: datetime
    progress: Optional[POCProgress] = None

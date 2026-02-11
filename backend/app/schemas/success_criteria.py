import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# SuccessCriterion
# ---------------------------------------------------------------------------

class SuccessCriterionBase(BaseModel):
    feature: str = Field(..., max_length=255)
    priority: Optional[str] = Field(None, max_length=50)
    criteria: Optional[str] = None
    current_state: Optional[str] = None
    notes: Optional[str] = None


class SuccessCriterionCreate(SuccessCriterionBase):
    """Required: feature."""
    sort_order: Optional[int] = 0


class SuccessCriterionUpdate(BaseModel):
    """PATCH-friendly: every field is optional."""
    feature: Optional[str] = Field(None, max_length=255)
    priority: Optional[str] = Field(None, max_length=50)
    criteria: Optional[str] = None
    current_state: Optional[str] = None
    notes: Optional[str] = None
    sort_order: Optional[int] = None


class SuccessCriterionResponse(SuccessCriterionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    poc_id: uuid.UUID
    sort_order: int
    created_at: datetime
    updated_at: datetime

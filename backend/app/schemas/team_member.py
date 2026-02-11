import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# TeamMember
# ---------------------------------------------------------------------------

class TeamMemberBase(BaseModel):
    team_side: Literal["sentry", "customer"]
    name: str = Field(..., max_length=255)
    role: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = None
    is_primary_contact: bool = False


class TeamMemberCreate(TeamMemberBase):
    """Required: team_side, name."""
    sort_order: Optional[int] = 0


class TeamMemberUpdate(BaseModel):
    """PATCH-friendly: every field is optional."""
    team_side: Optional[Literal["sentry", "customer"]] = None
    name: Optional[str] = Field(None, max_length=255)
    role: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = None
    is_primary_contact: Optional[bool] = None
    sort_order: Optional[int] = None


class TeamMemberResponse(TeamMemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    poc_id: uuid.UUID
    sort_order: int
    created_at: datetime
    updated_at: datetime

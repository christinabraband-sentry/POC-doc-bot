import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# GongCall
# ---------------------------------------------------------------------------

class GongCallBase(BaseModel):
    gong_call_id: str = Field(..., max_length=100)
    title: Optional[str] = Field(None, max_length=500)


class GongCallCreate(GongCallBase):
    """Required: gong_call_id."""
    started_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    participant_emails: Optional[list[str]] = None
    selected_for_analysis: bool = False


class GongCallUpdate(BaseModel):
    """PATCH-friendly: every field is optional."""
    title: Optional[str] = Field(None, max_length=500)
    started_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    participant_emails: Optional[list[str]] = None
    transcript_text: Optional[str] = None
    selected_for_analysis: Optional[bool] = None


class GongCallResponse(GongCallBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    poc_id: uuid.UUID
    started_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    participant_emails: Optional[list[str]] = None
    transcript_text: Optional[str] = None
    transcript_fetched_at: Optional[datetime] = None
    selected_for_analysis: bool
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# AIAnalysis
# ---------------------------------------------------------------------------

class AIAnalysisBase(BaseModel):
    input_call_ids: list[str]


class AIAnalysisCreate(AIAnalysisBase):
    """Required: input_call_ids."""
    pass


class AIAnalysisUpdate(BaseModel):
    """PATCH-friendly: every field is optional."""
    status: Optional[str] = Field(None, max_length=50)
    raw_response: Optional[str] = None
    extracted_data: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    model_used: Optional[str] = Field(None, max_length=100)
    token_usage: Optional[dict[str, Any]] = None
    completed_at: Optional[datetime] = None


class AIAnalysisResponse(AIAnalysisBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    poc_id: uuid.UUID
    status: str
    raw_response: Optional[str] = None
    extracted_data: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    model_used: Optional[str] = None
    token_usage: Optional[dict[str, Any]] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

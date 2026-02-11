import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# DocLink
# ---------------------------------------------------------------------------

class DocLinkBase(BaseModel):
    title: str = Field(..., max_length=255)
    url: str = Field(..., max_length=1000)
    category: str = Field(..., max_length=100)
    relevance_note: Optional[str] = None


class DocLinkCreate(DocLinkBase):
    """Required: title, url, category."""
    tech_stack_entry_id: Optional[uuid.UUID] = None
    sort_order: Optional[int] = 0


class DocLinkUpdate(BaseModel):
    """PATCH-friendly: every field is optional."""
    title: Optional[str] = Field(None, max_length=255)
    url: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)
    relevance_note: Optional[str] = None
    tech_stack_entry_id: Optional[uuid.UUID] = None
    sort_order: Optional[int] = None


class DocLinkResponse(DocLinkBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    poc_id: uuid.UUID
    tech_stack_entry_id: Optional[uuid.UUID] = None
    sort_order: int
    created_at: datetime


# ---------------------------------------------------------------------------
# TechStackEntry
# ---------------------------------------------------------------------------

class TechStackEntryBase(BaseModel):
    category: str = Field(..., max_length=100)
    name: str = Field(..., max_length=255)


class TechStackEntryCreate(TechStackEntryBase):
    """Required: category, name."""
    sentry_platform_key: Optional[str] = Field(None, max_length=100)
    confirmed_by_customer: bool = False


class TechStackEntryUpdate(BaseModel):
    """PATCH-friendly: every field is optional."""
    category: Optional[str] = Field(None, max_length=100)
    name: Optional[str] = Field(None, max_length=255)
    sentry_platform_key: Optional[str] = Field(None, max_length=100)
    confirmed_by_customer: Optional[bool] = None


class TechStackEntryResponse(TechStackEntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    poc_id: uuid.UUID
    sentry_platform_key: Optional[str] = None
    confirmed_by_customer: bool
    created_at: datetime
    updated_at: datetime

    doc_links: list[DocLinkResponse] = []

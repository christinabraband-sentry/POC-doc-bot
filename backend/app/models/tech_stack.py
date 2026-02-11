import uuid
from datetime import datetime

from sqlalchemy import String, Text, Boolean, DateTime, Integer, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TechStackEntry(Base):
    __tablename__ = "tech_stack_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    poc_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pocs.id", ondelete="CASCADE")
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # language, framework, platform
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sentry_platform_key: Mapped[str | None] = mapped_column(String(100), nullable=True)
    confirmed_by_customer: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    poc: Mapped["POC"] = relationship(back_populates="tech_stack_entries")
    doc_links: Mapped[list["DocLink"]] = relationship(
        back_populates="tech_stack_entry", cascade="all, delete-orphan"
    )


class DocLink(Base):
    __tablename__ = "doc_links"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    poc_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pocs.id", ondelete="CASCADE")
    )
    tech_stack_entry_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tech_stack_entries.id", ondelete="SET NULL"),
        nullable=True,
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    relevance_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    poc: Mapped["POC"] = relationship(back_populates="doc_links")
    tech_stack_entry: Mapped["TechStackEntry | None"] = relationship(
        back_populates="doc_links"
    )


from app.models.poc import POC  # noqa: E402

import uuid
from datetime import datetime, date

from sqlalchemy import String, Text, Date, DateTime, Float, Boolean, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class POC(Base):
    __tablename__ = "pocs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    account_name: Mapped[str] = mapped_column(String(255), nullable=False)
    account_domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    opportunity_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    share_token: Mapped[str] = mapped_column(
        String(64), unique=True, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="draft"
    )
    poc_start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    poc_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    value_framework: Mapped["ValueFramework | None"] = relationship(
        back_populates="poc", uselist=False, cascade="all, delete-orphan"
    )
    team_members: Mapped[list["TeamMember"]] = relationship(
        back_populates="poc", cascade="all, delete-orphan"
    )
    milestones: Mapped[list["Milestone"]] = relationship(
        back_populates="poc", cascade="all, delete-orphan"
    )
    phases: Mapped[list["Phase"]] = relationship(
        back_populates="poc", cascade="all, delete-orphan"
    )
    success_criteria: Mapped[list["SuccessCriterion"]] = relationship(
        back_populates="poc", cascade="all, delete-orphan"
    )
    tech_stack_entries: Mapped[list["TechStackEntry"]] = relationship(
        back_populates="poc", cascade="all, delete-orphan"
    )
    gong_calls: Mapped[list["GongCall"]] = relationship(
        back_populates="poc", cascade="all, delete-orphan"
    )
    ai_analyses: Mapped[list["AIAnalysis"]] = relationship(
        back_populates="poc", cascade="all, delete-orphan"
    )
    doc_links: Mapped[list["DocLink"]] = relationship(
        back_populates="poc", cascade="all, delete-orphan"
    )


# Avoid circular imports
from app.models.team_member import TeamMember  # noqa: E402
from app.models.mutual_action_plan import Milestone  # noqa: E402
from app.models.phase import Phase  # noqa: E402
from app.models.success_criteria import SuccessCriterion  # noqa: E402
from app.models.tech_stack import TechStackEntry, DocLink  # noqa: E402
from app.models.gong import GongCall, AIAnalysis  # noqa: E402


class ValueFramework(Base):
    __tablename__ = "value_frameworks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    poc_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pocs.id", ondelete="CASCADE"),
        unique=True,
    )
    current_challenges: Mapped[str | None] = mapped_column(Text, nullable=True)
    impact: Mapped[str | None] = mapped_column(Text, nullable=True)
    ideal_future_state: Mapped[str | None] = mapped_column(Text, nullable=True)
    everyday_metrics: Mapped[str | None] = mapped_column(Text, nullable=True)
    core_requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_generated: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    source_call_ids: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    poc: Mapped["POC"] = relationship(back_populates="value_framework")

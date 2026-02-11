import uuid
from typing import Any, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.poc import POC, ValueFramework
from app.models.gong import AIAnalysis, GongCall
from app.schemas.gong import AIAnalysisResponse

router = APIRouter(prefix="/pocs/{poc_id}/ai", tags=["ai-analysis"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_poc_or_404(poc_id: uuid.UUID, db: Session) -> POC:
    poc = db.query(POC).filter(POC.id == poc_id).first()
    if not poc:
        raise HTTPException(status_code=404, detail="POC not found")
    return poc


def _get_analysis_or_404(
    poc_id: uuid.UUID, analysis_id: uuid.UUID, db: Session
) -> AIAnalysis:
    analysis = (
        db.query(AIAnalysis)
        .filter(AIAnalysis.id == analysis_id, AIAnalysis.poc_id == poc_id)
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis


# ---------------------------------------------------------------------------
# Background task runner
# ---------------------------------------------------------------------------

def _run_analysis(analysis_id: uuid.UUID, poc_id: uuid.UUID):
    """
    Background task: run AI analysis on selected calls.
    Uses its own DB session since this runs outside the request lifecycle.
    """
    db = SessionLocal()
    try:
        analysis = db.query(AIAnalysis).filter(AIAnalysis.id == analysis_id).first()
        if not analysis:
            return

        # Gather transcripts from the selected calls
        calls = (
            db.query(GongCall)
            .filter(
                GongCall.poc_id == poc_id,
                GongCall.selected_for_analysis.is_(True),
                GongCall.transcript_text.isnot(None),
            )
            .all()
        )

        if not calls:
            analysis.status = "failed"
            analysis.error_message = "No calls with transcripts found for analysis"
            db.commit()
            return

        try:
            from app.services import ai_service

            result = ai_service.analyze_transcripts(
                transcripts=[
                    {"gong_call_id": c.gong_call_id, "transcript": c.transcript_text}
                    for c in calls
                ],
                poc_id=str(poc_id),
            )
            analysis.status = "completed"
            analysis.raw_response = result.get("raw_response")
            analysis.extracted_data = result.get("extracted_data")
            analysis.model_used = result.get("model_used")
            analysis.token_usage = result.get("token_usage")
            from datetime import datetime, timezone

            analysis.completed_at = datetime.now(timezone.utc)
        except Exception as e:
            analysis.status = "failed"
            analysis.error_message = str(e)

        db.commit()
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class ApplyOverrides(BaseModel):
    current_challenges: Optional[str] = None
    impact: Optional[str] = None
    ideal_future_state: Optional[str] = None
    everyday_metrics: Optional[str] = None
    core_requirements: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/analyze", response_model=AIAnalysisResponse, status_code=202)
def trigger_analysis(
    poc_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Trigger AI analysis on calls selected for analysis.
    Returns immediately with status=pending; work runs in the background.
    """
    poc = _get_poc_or_404(poc_id, db)

    # Collect selected call IDs
    selected_calls = (
        db.query(GongCall)
        .filter(
            GongCall.poc_id == poc_id,
            GongCall.selected_for_analysis.is_(True),
        )
        .all()
    )
    if not selected_calls:
        raise HTTPException(
            status_code=400,
            detail="No calls selected for analysis",
        )

    input_call_ids = [c.gong_call_id for c in selected_calls]

    analysis = AIAnalysis(
        poc_id=poc_id,
        status="pending",
        input_call_ids=input_call_ids,
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    background_tasks.add_task(_run_analysis, analysis.id, poc_id)

    return analysis


@router.get("/analyses", response_model=list[AIAnalysisResponse])
def list_analyses(poc_id: uuid.UUID, db: Session = Depends(get_db)):
    """List all AI analysis runs for a POC."""
    _get_poc_or_404(poc_id, db)
    analyses = (
        db.query(AIAnalysis)
        .filter(AIAnalysis.poc_id == poc_id)
        .order_by(AIAnalysis.created_at.desc())
        .all()
    )
    return analyses


@router.get("/analyses/{analysis_id}", response_model=AIAnalysisResponse)
def get_analysis(
    poc_id: uuid.UUID,
    analysis_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Get details of a specific analysis run."""
    return _get_analysis_or_404(poc_id, analysis_id, db)


@router.post("/analyses/{analysis_id}/apply", response_model=AIAnalysisResponse)
def apply_analysis(
    poc_id: uuid.UUID,
    analysis_id: uuid.UUID,
    overrides: Optional[ApplyOverrides] = None,
    db: Session = Depends(get_db),
):
    """
    Apply extracted data from an analysis to the POC's value framework.
    Optionally accepts field overrides to selectively replace extracted values.
    """
    poc = _get_poc_or_404(poc_id, db)
    analysis = _get_analysis_or_404(poc_id, analysis_id, db)

    if analysis.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Analysis is not completed (status: {analysis.status})",
        )

    extracted = analysis.extracted_data or {}

    # Find or create the value framework
    vf = db.query(ValueFramework).filter(ValueFramework.poc_id == poc_id).first()
    if not vf:
        vf = ValueFramework(poc_id=poc_id)
        db.add(vf)
        db.flush()

    # Apply extracted data, allowing overrides to take precedence
    override_data = overrides.model_dump(exclude_unset=True) if overrides else {}

    for field in [
        "current_challenges",
        "impact",
        "ideal_future_state",
        "everyday_metrics",
        "core_requirements",
    ]:
        if field in override_data:
            setattr(vf, field, override_data[field])
        elif field in extracted:
            setattr(vf, field, extracted[field])

    vf.ai_generated = True
    vf.ai_confidence_score = extracted.get("confidence_score")
    vf.source_call_ids = analysis.input_call_ids

    db.commit()
    db.refresh(analysis)
    return analysis

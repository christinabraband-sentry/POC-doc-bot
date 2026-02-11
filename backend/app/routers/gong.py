import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.poc import POC
from app.models.gong import GongCall
from app.schemas.gong import GongCallResponse

router = APIRouter(prefix="/pocs/{poc_id}/gong", tags=["gong"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_poc_or_404(poc_id: uuid.UUID, db: Session) -> POC:
    poc = db.query(POC).filter(POC.id == poc_id).first()
    if not poc:
        raise HTTPException(status_code=404, detail="POC not found")
    return poc


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class SearchCallsRequest(BaseModel):
    account_domain: str
    date_from: Optional[date] = None
    date_to: Optional[date] = None


class ToggleSelectedRequest(BaseModel):
    selected_for_analysis: bool


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/search-calls", response_model=list[GongCallResponse])
def search_gong_calls(
    poc_id: uuid.UUID,
    payload: SearchCallsRequest,
    db: Session = Depends(get_db),
):
    """
    Search for Gong calls by account domain. Calls gong_service.search_calls()
    to fetch from the Gong API, then upserts results into the database.
    """
    poc = _get_poc_or_404(poc_id, db)

    # Import the gong service; if not yet implemented, handle gracefully
    try:
        from app.services import gong_service
    except (ImportError, AttributeError):
        raise HTTPException(
            status_code=501,
            detail="Gong service is not yet implemented",
        )

    calls_data = gong_service.search_calls(
        account_domain=payload.account_domain,
        date_from=payload.date_from,
        date_to=payload.date_to,
    )

    results: list[GongCall] = []
    for call_data in calls_data:
        # Upsert: check if call already exists by gong_call_id
        existing = (
            db.query(GongCall)
            .filter(GongCall.gong_call_id == call_data["gong_call_id"])
            .first()
        )
        if existing:
            # Update fields
            existing.title = call_data.get("title", existing.title)
            existing.started_at = call_data.get("started_at", existing.started_at)
            existing.duration_seconds = call_data.get(
                "duration_seconds", existing.duration_seconds
            )
            existing.participant_emails = call_data.get(
                "participant_emails", existing.participant_emails
            )
            results.append(existing)
        else:
            gong_call = GongCall(
                poc_id=poc.id,
                gong_call_id=call_data["gong_call_id"],
                title=call_data.get("title"),
                started_at=call_data.get("started_at"),
                duration_seconds=call_data.get("duration_seconds"),
                participant_emails=call_data.get("participant_emails"),
            )
            db.add(gong_call)
            results.append(gong_call)

    db.commit()
    for r in results:
        db.refresh(r)

    return results


@router.get("/calls", response_model=list[GongCallResponse])
def list_gong_calls(poc_id: uuid.UUID, db: Session = Depends(get_db)):
    """List all cached Gong calls for this POC."""
    _get_poc_or_404(poc_id, db)
    calls = (
        db.query(GongCall)
        .filter(GongCall.poc_id == poc_id)
        .order_by(GongCall.started_at.desc().nullslast())
        .all()
    )
    return calls


@router.post(
    "/calls/{gong_call_id}/fetch-transcript",
    response_model=GongCallResponse,
)
def fetch_transcript(
    poc_id: uuid.UUID,
    gong_call_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Fetch the transcript for a specific Gong call via gong_service."""
    _get_poc_or_404(poc_id, db)
    call = (
        db.query(GongCall)
        .filter(GongCall.id == gong_call_id, GongCall.poc_id == poc_id)
        .first()
    )
    if not call:
        raise HTTPException(status_code=404, detail="Gong call not found")

    try:
        from app.services import gong_service
    except (ImportError, AttributeError):
        raise HTTPException(
            status_code=501,
            detail="Gong service is not yet implemented",
        )

    transcript_data = gong_service.fetch_transcript(call.gong_call_id)
    call.transcript_text = transcript_data.get("transcript_text")
    call.transcript_fetched_at = transcript_data.get("fetched_at")

    db.commit()
    db.refresh(call)
    return call


@router.patch(
    "/calls/{gong_call_id}/select",
    response_model=GongCallResponse,
)
def toggle_call_selection(
    poc_id: uuid.UUID,
    gong_call_id: uuid.UUID,
    payload: ToggleSelectedRequest,
    db: Session = Depends(get_db),
):
    """Toggle whether a Gong call is selected for AI analysis."""
    _get_poc_or_404(poc_id, db)
    call = (
        db.query(GongCall)
        .filter(GongCall.id == gong_call_id, GongCall.poc_id == poc_id)
        .first()
    )
    if not call:
        raise HTTPException(status_code=404, detail="Gong call not found")

    call.selected_for_analysis = payload.selected_for_analysis
    db.commit()
    db.refresh(call)
    return call

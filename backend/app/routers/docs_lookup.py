import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.poc import POC
from app.models.tech_stack import TechStackEntry, DocLink
from app.models.success_criteria import SuccessCriterion
from app.schemas.tech_stack import (
    TechStackEntryCreate,
    TechStackEntryResponse,
    TechStackEntryUpdate,
    DocLinkResponse,
)

router = APIRouter(prefix="/pocs/{poc_id}", tags=["docs-lookup"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_poc_or_404(poc_id: uuid.UUID, db: Session) -> POC:
    poc = db.query(POC).filter(POC.id == poc_id).first()
    if not poc:
        raise HTTPException(status_code=404, detail="POC not found")
    return poc


def _get_entry_or_404(
    poc_id: uuid.UUID, entry_id: uuid.UUID, db: Session
) -> TechStackEntry:
    entry = (
        db.query(TechStackEntry)
        .filter(TechStackEntry.id == entry_id, TechStackEntry.poc_id == poc_id)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Tech stack entry not found")
    return entry


# ---------------------------------------------------------------------------
# Tech Stack Endpoints
# ---------------------------------------------------------------------------

@router.get("/tech-stack", response_model=list[TechStackEntryResponse])
def list_tech_stack(poc_id: uuid.UUID, db: Session = Depends(get_db)):
    """List all tech stack entries with their associated doc links."""
    _get_poc_or_404(poc_id, db)
    entries = (
        db.query(TechStackEntry)
        .filter(TechStackEntry.poc_id == poc_id)
        .order_by(TechStackEntry.category, TechStackEntry.name)
        .all()
    )
    return entries


@router.post("/tech-stack", response_model=TechStackEntryResponse, status_code=201)
def create_tech_stack_entry(
    poc_id: uuid.UUID,
    payload: TechStackEntryCreate,
    db: Session = Depends(get_db),
):
    """Add a tech stack entry to a POC."""
    _get_poc_or_404(poc_id, db)
    entry = TechStackEntry(
        poc_id=poc_id,
        category=payload.category,
        name=payload.name,
        sentry_platform_key=payload.sentry_platform_key,
        confirmed_by_customer=payload.confirmed_by_customer,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/tech-stack/{entry_id}", status_code=204)
def delete_tech_stack_entry(
    poc_id: uuid.UUID,
    entry_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Remove a tech stack entry (and its associated doc links via cascade)."""
    entry = _get_entry_or_404(poc_id, entry_id, db)
    db.delete(entry)
    db.commit()
    return None


@router.patch(
    "/tech-stack/{entry_id}/confirm",
    response_model=TechStackEntryResponse,
)
def confirm_tech_stack_entry(
    poc_id: uuid.UUID,
    entry_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Confirm a tech stack entry (set confirmed_by_customer to True)."""
    entry = _get_entry_or_404(poc_id, entry_id, db)
    entry.confirmed_by_customer = True
    db.commit()
    db.refresh(entry)
    return entry


# ---------------------------------------------------------------------------
# Doc Links Generation
# ---------------------------------------------------------------------------

@router.post("/tech-stack/generate-doc-links", response_model=list[DocLinkResponse])
def generate_doc_links(poc_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Generate relevant Sentry documentation links based on the POC's tech stack
    and success criteria. Uses a docs service to determine relevant links.
    """
    poc = _get_poc_or_404(poc_id, db)

    tech_entries = (
        db.query(TechStackEntry)
        .filter(TechStackEntry.poc_id == poc_id)
        .all()
    )
    criteria = (
        db.query(SuccessCriterion)
        .filter(SuccessCriterion.poc_id == poc_id)
        .all()
    )

    try:
        from app.services import docs_service

        generated_links = docs_service.generate_doc_links(
            tech_stack=[
                {
                    "id": str(e.id),
                    "category": e.category,
                    "name": e.name,
                    "sentry_platform_key": e.sentry_platform_key,
                }
                for e in tech_entries
            ],
            success_criteria=[
                {"feature": c.feature, "criteria": c.criteria}
                for c in criteria
            ],
        )
    except (ImportError, AttributeError):
        raise HTTPException(
            status_code=501,
            detail="Docs service is not yet implemented",
        )

    # Clear existing generated doc links for this POC before inserting new ones
    db.query(DocLink).filter(DocLink.poc_id == poc_id).delete()
    db.flush()

    results: list[DocLink] = []
    for idx, link_data in enumerate(generated_links):
        doc_link = DocLink(
            poc_id=poc_id,
            tech_stack_entry_id=link_data.get("tech_stack_entry_id"),
            category=link_data["category"],
            title=link_data["title"],
            url=link_data["url"],
            relevance_note=link_data.get("relevance_note"),
            sort_order=idx,
        )
        db.add(doc_link)
        results.append(doc_link)

    db.commit()
    for r in results:
        db.refresh(r)

    return results


@router.get("/doc-links", response_model=list[DocLinkResponse])
def list_doc_links(poc_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get all generated doc links for a POC."""
    _get_poc_or_404(poc_id, db)
    links = (
        db.query(DocLink)
        .filter(DocLink.poc_id == poc_id)
        .order_by(DocLink.sort_order)
        .all()
    )
    return links

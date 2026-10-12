"""
API routes.

Key endpoints:
  POST /api/ideas                     -> create idea, returns idea_id
  GET  /api/ideas/{idea_id}/stream    -> SSE stream of pipeline progress
  GET  /api/ideas/{idea_id}/versions  -> list report versions (for history UI)
  GET  /api/reports/{version_id}      -> get one report's full JSON
  GET  /api/reports/{version_id}/export?format=markdown|pdf
  POST /api/ideas/{idea_id}/revise    -> re-run pipeline with revised text (new version)
"""
import json
import io

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Idea, ReportVersion, Source
from app.schemas import SubmitIdeaRequest, ReviseIdeaRequest, IntelligenceReport
from app.services.orchestrator import run_pipeline
from app.services.report import report_to_markdown

router = APIRouter()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    from app.core.config import settings
    total_ideas = db.query(Idea).count()
    total_reports = db.query(ReportVersion).count()
    total_sources = db.query(ReportVersion).join(ReportVersion.sources).count() if total_reports else 0
    scores = [v.novelty_score for v in db.query(ReportVersion).filter(ReportVersion.novelty_score.isnot(None)).all()]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0
    return {
        "total_ideas": total_ideas,
        "total_reports": total_reports,
        "total_sources": total_sources,
        "avg_novelty_score": avg_score,
        "demo_mode": settings.demo_mode,
        "llm_model": settings.llm_model,
        "environment": settings.environment,
    }


@router.get("/ideas")
def list_ideas(db: Session = Depends(get_db)):
    ideas = db.query(Idea).order_by(Idea.created_at.desc()).all()
    out = []
    for idea in ideas:
        latest_version = (
            db.query(ReportVersion)
            .filter(ReportVersion.idea_id == idea.id)
            .order_by(ReportVersion.version_number.desc())
            .first()
        )
        out.append({
            "id": idea.id,
            "raw_text": idea.raw_text,
            "created_at": idea.created_at.isoformat(),
            "versions_count": len(idea.report_versions),
            "latest_version_id": latest_version.id if latest_version else None,
            "latest_score": latest_version.novelty_score if latest_version else None,
            "has_report": bool(latest_version and latest_version.report_json),
        })
    return out


@router.get("/sources")
def list_sources(source_type: str | None = None, query: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Source)
    if source_type:
        q = q.filter(Source.source_type == source_type)
    if query:
        q = q.filter(Source.title.ilike(f"%{query}%") | Source.summary.ilike(f"%{query}%"))
    items = q.order_by(Source.id.desc()).limit(100).all()
    return [
        {
            "id": s.id,
            "report_version_id": s.report_version_id,
            "source_type": s.source_type,
            "title": s.title,
            "url": s.url,
            "summary": s.summary,
        }
        for s in items
    ]


@router.delete("/ideas/{idea_id}")
def delete_idea(idea_id: int, db: Session = Depends(get_db)):
    idea = db.get(Idea, idea_id)
    if not idea:
        raise HTTPException(404, "Idea not found")
    db.delete(idea)
    db.commit()
    return {"status": "deleted", "id": idea_id}


@router.post("/ideas")
def create_idea(body: SubmitIdeaRequest, db: Session = Depends(get_db)):
    idea = Idea(raw_text=body.raw_text)
    db.add(idea)
    db.commit()
    db.refresh(idea)
    return {"idea_id": idea.id}


@router.get("/ideas/{idea_id}/stream")
async def stream_pipeline(idea_id: int, db: Session = Depends(get_db)):
    idea = db.get(Idea, idea_id)
    if not idea:
        raise HTTPException(404, "Idea not found")

    async def event_generator():
        async for event in run_pipeline(db, idea_id, idea.raw_text):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/ideas/{idea_id}/revise")
async def revise_idea(idea_id: int, body: ReviseIdeaRequest, db: Session = Depends(get_db)):
    idea = db.get(Idea, idea_id)
    if not idea:
        raise HTTPException(404, "Idea not found")
    idea.raw_text = body.revised_text  # keep latest text; history lives in ReportVersion rows
    db.commit()

    async def event_generator():
        async for event in run_pipeline(db, idea_id, body.revised_text):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/ideas/{idea_id}/versions")
def list_versions(idea_id: int, db: Session = Depends(get_db)):
    versions = (
        db.query(ReportVersion)
        .filter(ReportVersion.idea_id == idea_id)
        .order_by(ReportVersion.version_number)
        .all()
    )
    return [
        {"id": v.id, "version_number": v.version_number, "novelty_score": v.novelty_score,
         "created_at": v.created_at.isoformat()}
        for v in versions
    ]


@router.get("/reports/{version_id}")
def get_report(version_id: int, db: Session = Depends(get_db)):
    version = db.get(ReportVersion, version_id)
    if not version or not version.report_json:
        raise HTTPException(404, "Report not found or not yet complete")
    return json.loads(version.report_json)


@router.get("/reports/{version_id}/export")
def export_report(version_id: int, format: str = "markdown", db: Session = Depends(get_db)):
    version = db.get(ReportVersion, version_id)
    if not version or not version.report_json:
        raise HTTPException(404, "Report not found or not yet complete")

    report = IntelligenceReport(**json.loads(version.report_json))
    md = report_to_markdown(report)

    if format == "markdown":
        return StreamingResponse(
            io.BytesIO(md.encode()), media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=syrax_report_v{version.version_number}.md"},
        )
    elif format == "pdf":
        # Simple markdown -> HTML -> PDF path. Requires `markdown` + a PDF
        # renderer (e.g. weasyprint) — install separately if you need PDF
        # export; kept optional so the core project doesn't need system deps.
        try:
            import markdown as md_lib
            from weasyprint import HTML
        except ImportError:
            raise HTTPException(
                501, "PDF export needs 'weasyprint' installed (pip install weasyprint)."
            )
        html = md_lib.markdown(md)
        pdf_bytes = HTML(string=html).write_pdf()
        return StreamingResponse(
            io.BytesIO(pdf_bytes), media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=syrax_report_v{version.version_number}.pdf"},
        )
    else:
        raise HTTPException(400, "format must be 'markdown' or 'pdf'")

"""
Pipeline orchestrator — runs every stage in order and yields progress
events as it goes, so the API layer can stream them to the frontend via SSE.

This is the ONLY place that calls every stage — no stage should call another
stage directly, which keeps each one independently testable (as done in
Parts 2-8 above).
"""
from collections.abc import AsyncGenerator
import asyncio
import json

from sqlalchemy.orm import Session

from app.models import Idea, ReportVersion, Source as SourceModel
from app.services.idea_analysis import analyze_idea
from app.services.search_github import search_github_multi
from app.services.search_papers import search_papers_multi
from app.services.rag import ingest_sources
from app.services.similarity import compute_novelty
from app.services.gaps import detect_gaps
from app.services.recommendations import generate_recommendations
from app.services.architecture import generate_architecture
from app.services.report import assemble_report


async def run_pipeline(db: Session, idea_id: int, raw_text: str) -> AsyncGenerator[dict, None]:
    """Async generator yielding {"stage": ..., "status": ..., "detail": ...}
    events for SSE, and creating a ReportVersion row at the end."""

    idea = db.get(Idea, idea_id)
    next_version = len(idea.report_versions) + 1
    report_version = ReportVersion(idea_id=idea_id, version_number=next_version)
    db.add(report_version)
    db.commit()
    db.refresh(report_version)

    try:
        yield {"stage": "idea_analysis", "status": "running"}
        idea_analysis = analyze_idea(raw_text)
        yield {"stage": "idea_analysis", "status": "done", "detail": idea_analysis.model_dump()}

        yield {"stage": "search", "status": "running"}
        github_results = search_github_multi(idea_analysis.key_search_terms)
        paper_results = search_papers_multi(idea_analysis.key_search_terms)
        all_sources = github_results + paper_results
        yield {"stage": "search", "status": "done", "detail": {"count": len(all_sources)}}

        yield {"stage": "rag", "status": "running"}
        ingest_sources(report_version.id, all_sources)
        yield {"stage": "rag", "status": "done"}

        yield {"stage": "similarity", "status": "running"}
        novelty = compute_novelty(raw_text, all_sources)
        yield {"stage": "similarity", "status": "done", "detail": {"novelty_score": novelty.novelty_score}}

        yield {"stage": "gaps", "status": "running"}
        gaps = detect_gaps(idea_analysis, all_sources)
        yield {"stage": "gaps", "status": "done", "detail": {"count": len(gaps)}}

        yield {"stage": "recommendations", "status": "running"}
        recommendations = generate_recommendations(idea_analysis, gaps)
        yield {"stage": "recommendations", "status": "done", "detail": {"count": len(recommendations)}}

        yield {"stage": "architecture", "status": "running"}
        architecture = generate_architecture(idea_analysis, recommendations)
        yield {"stage": "architecture", "status": "done"}

        yield {"stage": "report", "status": "running"}
        report = assemble_report(
            idea_id=idea_id,
            version_number=next_version,
            idea_summary=idea_analysis,
            novelty=novelty,
            gaps=gaps,
            recommendations=recommendations,
            architecture=architecture,
            sources_used=all_sources,
        )

        # Persist sources + final report JSON on the ReportVersion row.
        for src in all_sources:
            db.add(SourceModel(
                report_version_id=report_version.id,
                source_type=src.source_type, title=src.title,
                url=src.url, summary=src.summary,
            ))
        report_version.novelty_score = novelty.novelty_score
        report_version.report_json = report.model_dump_json()
        db.commit()

        yield {"stage": "report", "status": "done", "detail": {"report_version_id": report_version.id}}
        yield {"stage": "pipeline", "status": "complete", "detail": {"report_version_id": report_version.id}}

    except Exception as e:
        yield {"stage": "pipeline", "status": "error", "detail": {"message": str(e)}}
        raise

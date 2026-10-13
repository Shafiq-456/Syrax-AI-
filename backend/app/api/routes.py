"""
API routes for Syrax AI.

Includes:
- Multi-tenant Authentication & Workspace Isolation (/api/auth/*)
- Telemetry & System Statistics with Provenance (/api/stats)
- Idea Management & Project Scoping (/api/ideas)
- Real-time 8-Stage SSE Pipeline Streaming & Cancellation (/api/ideas/{id}/stream, /api/ideas/{id}/cancel)
- Versioned Dossiers & Iteration History (/api/ideas/{id}/versions, /api/ideas/{id}/revise)
- Multi-format Export: Markdown & PDF (/api/reports/{id}/export)
- Research Explorer Source Retrieval (/api/sources)
"""
import io
import json
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Idea, ReportVersion, Source, User, Workspace, WorkspaceMember
from app.schemas import (
    SubmitIdeaRequest, ReviseIdeaRequest, IntelligenceReport,
    UserRegisterRequest, UserLoginRequest, AuthResponse,
)
from app.core.auth import (
    hash_password, verify_password, create_access_token,
    get_current_workspace_id, get_current_user_optional, get_default_workspace,
)
from app.services.orchestrator import run_pipeline
from app.services.report import report_to_markdown
from app.services.pdf_export import generate_pdf_report

router = APIRouter()


# ── Authentication & Multi-Tenant Workspaces ──────────────────────────────────

@router.post("/auth/register", response_model=AuthResponse)
def register(body: UserRegisterRequest, db: Session = Depends(get_db)):
    email_clean = body.email.strip().lower()
    if db.query(User).filter(User.email == email_clean).first():
        raise HTTPException(400, "Email already registered")

    user = User(
        email=email_clean,
        hashed_password=hash_password(body.password),
        full_name=body.full_name or email_clean.split("@")[0].title(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    ws_name = body.workspace_name or f"{user.full_name}'s Lab"
    slug = re.sub(r'[^a-zA-Z0-9]', '-', ws_name.lower()).strip('-') + f"-{user.id}"
    workspace = Workspace(name=ws_name, slug=slug)
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    member = WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role="owner")
    db.add(member)
    db.commit()

    token = create_access_token(user.id, workspace.id, user.email)
    return AuthResponse(
        token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        workspace_id=workspace.id,
        workspace_name=workspace.name,
        role="owner",
    )


@router.post("/auth/login", response_model=AuthResponse)
def login(body: UserLoginRequest, db: Session = Depends(get_db)):
    email_clean = body.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")

    membership = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user.id).first()
    if membership:
        workspace = membership.workspace
        role = membership.role
    else:
        workspace = get_default_workspace(db)
        role = "member"

    token = create_access_token(user.id, workspace.id, user.email)
    return AuthResponse(
        token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        workspace_id=workspace.id,
        workspace_name=workspace.name,
        role=role,
    )


@router.get("/auth/me")
def get_current_user_profile(
    user: Optional[User] = Depends(get_current_user_optional),
    workspace_id: int = Depends(get_current_workspace_id),
    db: Session = Depends(get_db),
):
    ws = db.get(Workspace, workspace_id) or get_default_workspace(db)
    if user:
        return {
            "authenticated": True,
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "workspace_id": ws.id,
            "workspace_name": ws.name,
        }
    return {
        "authenticated": False,
        "user_id": None,
        "email": "guest@syrax.ai",
        "full_name": "Guest Researcher",
        "workspace_id": ws.id,
        "workspace_name": ws.name,
    }


# ── Telemetry & Workspace Stats ───────────────────────────────────────────────

@router.get("/stats")
def get_stats(
    workspace_id: int = Depends(get_current_workspace_id),
    db: Session = Depends(get_db)
):
    from app.core.config import settings

    # Scoped query: ideas belonging to this workspace or unassigned legacy ideas
    ideas_q = db.query(Idea).filter((Idea.workspace_id == workspace_id) | (Idea.workspace_id.is_(None)))
    idea_ids = [i.id for i in ideas_q.all()]

    reports_q = db.query(ReportVersion).filter(ReportVersion.idea_id.in_(idea_ids)) if idea_ids else []
    total_ideas = len(idea_ids)
    total_reports = reports_q.count() if idea_ids else 0
    total_sources = reports_q.join(ReportVersion.sources).count() if total_reports else 0

    scores = [v.novelty_score for v in reports_q.filter(ReportVersion.novelty_score.isnot(None)).all()] if idea_ids else []
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    ws = db.get(Workspace, workspace_id) or get_default_workspace(db)

    return {
        "total_ideas": total_ideas,
        "total_reports": total_reports,
        "total_sources": total_sources,
        "avg_novelty_score": avg_score,
        "demo_mode": settings.demo_mode,
        "llm_model": settings.llm_model,
        "environment": settings.environment,
        "workspace_id": ws.id,
        "workspace_name": ws.name,
    }


# ── Project Ideas & Lifecycle ─────────────────────────────────────────────────

@router.get("/ideas")
def list_ideas(
    workspace_id: int = Depends(get_current_workspace_id),
    db: Session = Depends(get_db)
):
    ideas = (
        db.query(Idea)
        .filter((Idea.workspace_id == workspace_id) | (Idea.workspace_id.is_(None)))
        .order_by(Idea.created_at.desc())
        .all()
    )
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
            "status": latest_version.status if latest_version else "pending",
        })
    return out


@router.post("/ideas")
def create_idea(
    body: SubmitIdeaRequest,
    workspace_id: int = Depends(get_current_workspace_id),
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    idea = Idea(
        raw_text=body.raw_text,
        workspace_id=workspace_id,
        user_id=user.id if user else None,
    )
    db.add(idea)
    db.commit()
    db.refresh(idea)
    return {"idea_id": idea.id, "workspace_id": workspace_id}


@router.delete("/ideas/{idea_id}")
def delete_idea(
    idea_id: int,
    workspace_id: int = Depends(get_current_workspace_id),
    db: Session = Depends(get_db)
):
    idea = db.get(Idea, idea_id)
    if not idea:
        raise HTTPException(404, "Idea not found")
    if idea.workspace_id and idea.workspace_id != workspace_id:
        raise HTTPException(403, "Permission denied: idea belongs to another workspace")

    db.delete(idea)
    db.commit()
    return {"status": "deleted", "id": idea_id}


# ── Pipeline Orchestration & Job Cancellation ────────────────────────────────

@router.get("/ideas/{idea_id}/stream")
async def stream_pipeline(idea_id: int, db: Session = Depends(get_db)):
    idea = db.get(Idea, idea_id)
    if not idea:
        raise HTTPException(404, "Idea not found")

    async def event_generator():
        async for event in run_pipeline(db, idea_id, idea.raw_text):
            yield f"data: {json.dumps(event)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/ideas/{idea_id}/cancel")
def cancel_pipeline(idea_id: int, db: Session = Depends(get_db)):
    """Cancel an in-progress pipeline run and mark the version status as cancelled."""
    idea = db.get(Idea, idea_id)
    if not idea:
        raise HTTPException(404, "Idea not found")

    latest_version = (
        db.query(ReportVersion)
        .filter(ReportVersion.idea_id == idea_id)
        .order_by(ReportVersion.version_number.desc())
        .first()
    )
    if latest_version and latest_version.status == "running":
        latest_version.status = "cancelled"
        db.commit()
        return {"status": "cancelled", "idea_id": idea_id, "version_id": latest_version.id}

    return {"status": "no_active_run", "idea_id": idea_id}


@router.post("/ideas/{idea_id}/revise")
async def revise_idea(idea_id: int, body: ReviseIdeaRequest, db: Session = Depends(get_db)):
    idea = db.get(Idea, idea_id)
    if not idea:
        raise HTTPException(404, "Idea not found")
    idea.raw_text = body.revised_text
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
        {
            "id": v.id,
            "version_number": v.version_number,
            "status": v.status,
            "novelty_score": v.novelty_score,
            "created_at": v.created_at.isoformat(),
        }
        for v in versions
    ]


# ── Reports & Multi-Format Export ─────────────────────────────────────────────

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

    if format == "markdown":
        md = report_to_markdown(report)
        return StreamingResponse(
            io.BytesIO(md.encode('utf-8')), media_type="text/markdown",
            headers={"Content-Disposition": f"attachment; filename=syrax_report_v{version.version_number}.md"},
        )
    elif format == "pdf":
        pdf_bytes = generate_pdf_report(report)
        return StreamingResponse(
            io.BytesIO(pdf_bytes), media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=syrax_report_v{version.version_number}.pdf"},
        )
    else:
        raise HTTPException(400, "format must be 'markdown' or 'pdf'")


# ── Research Explorer Source Retrieval ───────────────────────────────────────

@router.get("/sources")
def list_sources(
    source_type: str | None = None,
    query: str | None = None,
    db: Session = Depends(get_db),
):
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
            "provenance": getattr(s, "provenance", "live"),
        }
        for s in items
    ]

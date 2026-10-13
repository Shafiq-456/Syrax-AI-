"""
Core data models for Syrax.

Includes:
- Multi-tenant User and Workspace models for authentication and isolation.
- Idea with workspace scoping.
- ReportVersion with explicit execution lifecycle status (pending, running, completed, failed, cancelled).
- Source with provenance metadata (live vs. simulated fixture).
"""
from datetime import datetime, timezone

from sqlalchemy import String, Text, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    workspaces: Mapped[list["WorkspaceMember"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    ideas: Mapped[list["Idea"]] = relationship(back_populates="user")


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    members: Mapped[list["WorkspaceMember"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    ideas: Mapped[list["Idea"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    workspace_id: Mapped[int] = mapped_column(ForeignKey("workspaces.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    role: Mapped[str] = mapped_column(String(50), default="member")  # "owner", "admin", "member"

    workspace: Mapped["Workspace"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="workspaces")


class Idea(Base):
    __tablename__ = "ideas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    workspace_id: Mapped[int | None] = mapped_column(ForeignKey("workspaces.id"), nullable=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    raw_text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    workspace: Mapped["Workspace | None"] = relationship(back_populates="ideas")
    user: Mapped["User | None"] = relationship(back_populates="ideas")
    report_versions: Mapped[list["ReportVersion"]] = relationship(
        back_populates="idea", cascade="all, delete-orphan"
    )


class ReportVersion(Base):
    __tablename__ = "report_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    idea_id: Mapped[int] = mapped_column(ForeignKey("ideas.id"))
    version_number: Mapped[int] = mapped_column(Integer, default=1)

    # Job lifecycle tracking: pending, running, completed, failed, cancelled
    status: Mapped[str] = mapped_column(String(50), default="completed")
    novelty_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    report_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    idea: Mapped["Idea"] = relationship(back_populates="report_versions")
    sources: Mapped[list["Source"]] = relationship(
        back_populates="report_version", cascade="all, delete-orphan"
    )


class Source(Base):
    """A single retrieved GitHub repo or paper, tied to a report version."""
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    report_version_id: Mapped[int] = mapped_column(ForeignKey("report_versions.id"))

    source_type: Mapped[str] = mapped_column(String(20))  # "github" | "paper"
    title: Mapped[str] = mapped_column(String(500))
    url: Mapped[str] = mapped_column(String(1000))
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Provenance tracking: "live" | "simulated"
    provenance: Mapped[str] = mapped_column(String(50), default="live")

    report_version: Mapped["ReportVersion"] = relationship(back_populates="sources")

"""
Core data models for Syrax.

Designed with the versioning/iteration loop in mind from day one (Part 9):
an Idea can have many ReportVersions, each with its own novelty score,
so comparing v1 vs v2 is just a query, not a redesign later.

This is Part 1 scaffolding only — fields will grow as Parts 3-9 are built,
but the shape (Idea -> many ReportVersions -> many Sources) should not
need to change.
"""
from datetime import datetime, timezone

from sqlalchemy import String, Text, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Idea(Base):
    __tablename__ = "ideas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    raw_text: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    report_versions: Mapped[list["ReportVersion"]] = relationship(
        back_populates="idea", cascade="all, delete-orphan"
    )


class ReportVersion(Base):
    __tablename__ = "report_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    idea_id: Mapped[int] = mapped_column(ForeignKey("ideas.id"))
    version_number: Mapped[int] = mapped_column(Integer, default=1)

    # Filled in by later parts — nullable for now so Part 1 can create rows.
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
    """A single retrieved GitHub repo or paper, tied to a report version
    so every claim/recommendation can cite back to one of these rows."""
    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    report_version_id: Mapped[int] = mapped_column(ForeignKey("report_versions.id"))

    source_type: Mapped[str] = mapped_column(String(20))  # "github" | "paper"
    title: Mapped[str] = mapped_column(String(500))
    url: Mapped[str] = mapped_column(String(1000))
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    report_version: Mapped["ReportVersion"] = relationship(back_populates="sources")

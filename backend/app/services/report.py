"""
Part 9: Report Assembler + Export — consolidates every stage's output into
the final IntelligenceReport, and renders it as Markdown (PDF is generated
from the Markdown at the API layer using a simple HTML->PDF step, kept out
of this module so report assembly stays dependency-light and testable).
"""
from app.schemas import (
    IdeaAnalysis, NoveltyResult, Gap, Recommendation,
    ArchitectureSuggestion, SourceItem, IntelligenceReport,
)


def assemble_report(
    idea_id: int,
    version_number: int,
    idea_summary: IdeaAnalysis,
    novelty: NoveltyResult,
    gaps: list[Gap],
    recommendations: list[Recommendation],
    architecture: ArchitectureSuggestion,
    sources_used: list[SourceItem],
) -> IntelligenceReport:
    return IntelligenceReport(
        idea_id=idea_id,
        version_number=version_number,
        idea_summary=idea_summary,
        novelty=novelty,
        gaps=gaps,
        recommendations=recommendations,
        architecture=architecture,
        sources_used=sources_used,
    )


def report_to_markdown(report: IntelligenceReport) -> str:
    lines = [
        f"# Syrax Intelligence Report — v{report.version_number}",
        "",
        "## Idea Summary",
        f"- **Problem domain:** {report.idea_summary.problem_domain}",
        f"- **Target user:** {report.idea_summary.target_user}",
        f"- **Approach:** {report.idea_summary.core_technical_approach}",
        "",
        "## Novelty Score",
        f"**{report.novelty.novelty_score}/100** "
        f"(confidence: {report.novelty.confidence} — {report.novelty.confidence_reason})",
        "",
        "### Most overlapping existing work",
    ]
    for s in report.novelty.top_overlapping_sources:
        lines.append(
            f"- [{s.source.title}]({s.source.url}) — overlap score {s.combined_score}: {s.reasoning}"
        )

    lines += ["", "## Innovation Gaps"]
    if not report.gaps:
        lines.append("_No significant gaps identified from the sources found._")
    for g in report.gaps:
        lines.append(f"- **{g.description}** — {g.why_it_matters}")
        lines.append(f"  - Evidence: {', '.join(g.evidence_sources)}")

    lines += ["", "## Recommendations"]
    for r in report.recommendations:
        lines.append(f"- {r.suggestion}")
        lines.append(f"  - Sources: {', '.join(r.cited_sources)}")

    lines += ["", "## Suggested Architecture"]
    lines.append("**Stack:** " + ", ".join(report.architecture.stack))
    lines.append("**Key components:** " + ", ".join(report.architecture.key_components))
    lines += ["", "**Roadmap:**"]
    for step in report.architecture.roadmap:
        lines.append(f"- {step}")

    lines += ["", "## All Sources Used"]
    for s in report.sources_used:
        lines.append(f"- [{s.title}]({s.url}) ({s.source_type})")

    return "\n".join(lines)

"""
Pydantic schemas — the contracts between pipeline stages and the API.
Keeping these separate from the SQLAlchemy models (app/models) on purpose:
these are for structured LLM output + API request/response bodies.
"""
from pydantic import BaseModel, Field


# ---------- Stage 1: Idea Analysis ----------
class IdeaAnalysis(BaseModel):
    problem_domain: str
    target_user: str
    core_technical_approach: str
    claimed_differentiators: list[str]
    key_search_terms: list[str] = Field(description="3-6 short search queries")


# ---------- Stage 2: Search results (GitHub + Papers) ----------
class SourceItem(BaseModel):
    source_type: str  # "github" | "paper"
    title: str
    url: str
    summary: str  # README excerpt or abstract
    metadata: dict = {}  # stars, published_date, citation_count, etc.


# ---------- Stage 5: Similarity / Novelty ----------
class SourceScore(BaseModel):
    source: SourceItem
    cosine_similarity: float
    llm_semantic_score: float  # 0-1, LLM-judged "do they solve the same problem"
    combined_score: float
    reasoning: str  # why this source overlaps (or doesn't)


class NoveltyResult(BaseModel):
    novelty_score: int  # 0-100, higher = more novel
    top_overlapping_sources: list[SourceScore]
    confidence: str  # "high" | "medium" | "low"
    confidence_reason: str


# ---------- Stage 6: Gaps ----------
class Gap(BaseModel):
    description: str
    evidence_sources: list[str]  # URLs
    why_it_matters: str


# ---------- Stage 7: Recommendations ----------
class Recommendation(BaseModel):
    suggestion: str
    cited_sources: list[str]  # URLs — every recommendation must cite something
    related_gap: str | None = None


# ---------- Stage 8: Architecture + Roadmap ----------
class ArchitectureSuggestion(BaseModel):
    stack: list[str]
    key_components: list[str]
    roadmap: list[str]  # phased milestones, MVP -> v1 -> v2


# ---------- Final report ----------
class IntelligenceReport(BaseModel):
    idea_id: int
    version_number: int
    idea_summary: IdeaAnalysis
    novelty: NoveltyResult
    gaps: list[Gap]
    recommendations: list[Recommendation]
    architecture: ArchitectureSuggestion
    sources_used: list[SourceItem]


# ---------- API request bodies ----------
class SubmitIdeaRequest(BaseModel):
    raw_text: str


class ReviseIdeaRequest(BaseModel):
    idea_id: int
    revised_text: str

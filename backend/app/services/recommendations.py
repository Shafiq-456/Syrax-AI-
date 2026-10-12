"""
Part 7: AI Recommendations — generates concrete suggestions to differentiate
the idea, based on the gaps found. Every recommendation MUST cite at least
one source URL — this is a hard requirement, not a nice-to-have.
"""
import json

from app.schemas import IdeaAnalysis, Gap, Recommendation
from app.services.llm_client import llm_chat

SYSTEM_PROMPT = """You generate concrete, actionable recommendations to help
differentiate a project idea, based on identified innovation gaps.

CRITICAL RULE: every recommendation must cite at least one source URL from
the gaps' evidence_sources. Never produce a recommendation with an empty
cited_sources list — if you can't ground it, don't suggest it.

Respond with ONLY a JSON array:
[
  {"suggestion": "...", "cited_sources": ["<url>", ...], "related_gap": "<gap description>"}
]
Return at most 5 recommendations.
"""


def generate_recommendations(idea: IdeaAnalysis, gaps: list[Gap]) -> list[Recommendation]:
    if not gaps:
        return []

    gaps_text = "\n\n".join(
        f"Gap: {g.description}\nEvidence: {g.evidence_sources}\nWhy it matters: {g.why_it_matters}"
        for g in gaps
    )
    prompt = f"IDEA:\n{idea.model_dump_json(indent=2)}\n\nGAPS FOUND:\n{gaps_text}"

    data = json.loads(llm_chat(SYSTEM_PROMPT, prompt, max_tokens=1500))
    return [Recommendation(**r) for r in data if r.get("cited_sources")]

"""
Part 8: Architecture + Roadmap generation — suggests a technical stack and
a phased build plan for the USER'S idea (not for Syrax itself).
"""
import json

from app.schemas import IdeaAnalysis, Recommendation, ArchitectureSuggestion
from app.services.llm_client import llm_chat

SYSTEM_PROMPT = """You suggest a practical technical architecture and a phased
build roadmap (MVP -> v1 -> v2) for a project idea, taking into account the
differentiation recommendations already generated for it.

Respond with ONLY a JSON object:
{
  "stack": ["technology choices with a one-line reason each"],
  "key_components": ["main system components/modules"],
  "roadmap": ["MVP: ...", "v1: ...", "v2: ..."]
}
"""


def generate_architecture(
    idea: IdeaAnalysis, recommendations: list[Recommendation]
) -> ArchitectureSuggestion:
    recs_text = "\n".join(f"- {r.suggestion}" for r in recommendations) or "(none)"
    prompt = (
        f"IDEA:\n{idea.model_dump_json(indent=2)}\n\n"
        f"DIFFERENTIATION RECOMMENDATIONS TO DESIGN FOR:\n{recs_text}"
    )

    data = json.loads(llm_chat(SYSTEM_PROMPT, prompt, max_tokens=1200))
    return ArchitectureSuggestion(**data)

"""
Part 6: Innovation Gap Detection — finds approaches/features in the
retrieved sources that the user's idea does NOT cover, using the LLM
grounded on the actual retrieved summaries (not free invention).
"""
import json

from app.schemas import IdeaAnalysis, SourceItem, Gap
from app.services.llm_client import llm_chat

SYSTEM_PROMPT = """TASK: identify innovation gaps: approaches or features present
in the existing work below that the user's idea does NOT currently cover.
Ground every gap in the specific sources provided — never invent a gap that
isn't supported by at least one source.

Respond with ONLY a JSON array, no preamble:
[
  {"description": "...", "evidence_sources": ["<url>", ...], "why_it_matters": "..."}
]
Return at most 5 gaps. If there aren't clear gaps, return an empty array.
"""


def detect_gaps(idea: IdeaAnalysis, sources: list[SourceItem]) -> list[Gap]:
    if not sources:
        return []

    sources_text = "\n\n".join(
        f"[{s.url}] {s.title}\n{s.summary}" for s in sources
    )
    prompt = (
        f"USER'S IDEA:\n{idea.model_dump_json(indent=2)}\n\n"
        f"EXISTING WORK FOUND:\n{sources_text}"
    )

    data = json.loads(llm_chat(SYSTEM_PROMPT, prompt, max_tokens=1500))
    return [Gap(**g) for g in data]

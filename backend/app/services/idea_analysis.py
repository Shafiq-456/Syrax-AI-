"""
Part 3: Idea Analysis — turns raw free-text into a structured IdeaAnalysis
object using an LLM with a forced JSON schema. Every downstream stage reads
this structured object, never the raw text again.
"""
import json

from app.schemas import IdeaAnalysis
from app.services.llm_client import llm_chat

SYSTEM_PROMPT = """You are an idea-analysis engine. Given a raw project idea,
extract structured information about it. Respond with ONLY a JSON object,
no preamble, no markdown fences — just the raw JSON matching this schema:

{
  "problem_domain": "short phrase for the problem space",
  "target_user": "who this is for",
  "core_technical_approach": "how it works, technically, in 1-2 sentences",
  "claimed_differentiators": ["what the user believes makes this different"],
  "key_search_terms": ["3-6 short search queries to find similar existing work"]
}
"""


def analyze_idea(raw_text: str) -> IdeaAnalysis:
    text = llm_chat(SYSTEM_PROMPT, raw_text, max_tokens=1000)
    data = json.loads(text)
    return IdeaAnalysis(**data)


if __name__ == "__main__":
    result = analyze_idea(
        "An app that recommends recipes based on what's already in your fridge, "
        "using a photo of your fridge contents."
    )
    print(result.model_dump_json(indent=2))

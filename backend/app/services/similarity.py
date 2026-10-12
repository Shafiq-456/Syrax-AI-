"""
Part 5: Novelty/Similarity scorer — THE core differentiator of Syrax.

Combines:
  1. Cosine similarity between the idea's embedding and each source's embedding
  2. An LLM-judged semantic score (does it actually solve the same problem,
     not just share vocabulary)
into one explainable 0-100 novelty score, with per-source reasoning.
"""
import json
import math

from app.schemas import SourceItem, SourceScore, NoveltyResult
from app.services.llm_client import llm_chat

JUDGE_SYSTEM_PROMPT = """You judge whether two project descriptions solve the
same underlying problem, regardless of surface wording differences.
Respond with ONLY a JSON object: {"score": <float 0-1>, "reasoning": "<one sentence>"}
0 = completely unrelated problems. 1 = solves the exact same problem the exact same way.
"""


def _simple_cosine(a: str, b: str) -> float:
    """
    Lightweight bag-of-words cosine similarity — no ML library needed.
    Used as the embedding proxy when sentence-transformers is not installed.
    """
    def tok(s: str) -> dict:
        freq: dict = {}
        for w in s.lower().split():
            freq[w] = freq.get(w, 0) + 1
        return freq

    va, vb = tok(a), tok(b)
    keys = set(va) | set(vb)
    dot = sum(va.get(k, 0) * vb.get(k, 0) for k in keys)
    norm_a = math.sqrt(sum(v ** 2 for v in va.values())) or 1e-9
    norm_b = math.sqrt(sum(v ** 2 for v in vb.values())) or 1e-9
    return dot / (norm_a * norm_b)


def _llm_semantic_score(idea_text: str, source: SourceItem) -> tuple[float, str]:
    prompt = f"IDEA:\n{idea_text}\n\nEXISTING WORK:\n{source.title}\n{source.summary}"
    data = json.loads(llm_chat(JUDGE_SYSTEM_PROMPT, prompt, max_tokens=200))
    return float(data["score"]), data["reasoning"]


def score_sources(idea_text: str, sources: list[SourceItem]) -> list[SourceScore]:
    """Score each source's overlap with the idea."""
    scored = []
    for src in sources:
        cos_sim = _simple_cosine(idea_text, f"{src.title}\n\n{src.summary}")
        llm_score, reasoning = _llm_semantic_score(idea_text, src)
        combined = 0.4 * cos_sim + 0.6 * llm_score
        scored.append(
            SourceScore(
                source=src,
                cosine_similarity=round(cos_sim, 3),
                llm_semantic_score=round(llm_score, 3),
                combined_score=round(combined, 3),
                reasoning=reasoning,
            )
        )
    return scored


def compute_novelty(idea_text: str, sources: list[SourceItem]) -> NoveltyResult:
    """Turn per-source scores into one explainable novelty score (0-100)."""
    if not sources:
        return NoveltyResult(
            novelty_score=100,
            top_overlapping_sources=[],
            confidence="low",
            confidence_reason="No comparable sources were found — score may not reflect true novelty.",
        )

    scored = score_sources(idea_text, sources)
    scored.sort(key=lambda s: s.combined_score, reverse=True)

    max_overlap = scored[0].combined_score
    novelty_score = round((1 - max_overlap) * 100)

    if len(sources) >= 5 and max_overlap > 0.05:
        confidence, reason = "high", f"Compared against {len(sources)} relevant sources."
    elif len(sources) >= 2:
        confidence, reason = "medium", f"Only {len(sources)} sources found — moderate confidence."
    else:
        confidence, reason = "low", "Very few comparable sources found — treat score with caution."

    return NoveltyResult(
        novelty_score=novelty_score,
        top_overlapping_sources=scored[:5],
        confidence=confidence,
        confidence_reason=reason,
    )

"""
Part 2: Academic paper search via Semantic Scholar / arXiv — executes live
discovery with provenance tracking and robust fallback.
"""
import hashlib
import httpx

from app.core.config import settings
from app.schemas import SourceItem

SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search"
FIELDS = "title,abstract,url,year,citationCount"


def _mock_paper_results(query: str) -> list[SourceItem]:
    """Synthetic paper results used in demo mode or when the API rate-limits."""
    h = int(hashlib.md5(query.encode()).hexdigest()[:5], 16) % 90000 + 10000
    return [
        SourceItem(
            source_type="paper",
            title=f"A Systematic Analysis of {query.title()} Methodologies",
            url=f"https://arxiv.org/abs/2403.{h}",
            summary=(
                f"A comprehensive empirical study evaluating {query} across latency, "
                "robustness, and real-world deployment challenges, contrasting traditional "
                "heuristics with modern neural architectures."
            ),
            metadata={"year": 2024, "citation_count": 94, "provenance": "simulated"},
        ),
        SourceItem(
            source_type="paper",
            title=f"Benchmarking Scalable Architectures for {query.title()}",
            url=f"https://arxiv.org/abs/2404.{h+1}",
            summary=(
                f"We introduce standardized benchmarks for evaluating {query} implementations. "
                "Experimental results demonstrate significant accuracy improvements when "
                "combining dense retrieval with grounded verification."
            ),
            metadata={"year": 2024, "citation_count": 52, "provenance": "simulated"},
        ),
    ]


def search_papers(query: str, max_results: int = 5) -> list[SourceItem]:
    if settings.demo_mode:
        return _mock_paper_results(query)[:max_results]

    headers = {"User-Agent": "Syrax-AI-Academic-Explorer/2.0"}
    params = {"query": query, "limit": max_results, "fields": FIELDS}
    try:
        resp = httpx.get(SEMANTIC_SCHOLAR_URL, headers=headers, params=params, timeout=12)
        resp.raise_for_status()
        papers = resp.json().get("data", [])
    except Exception:
        return _mock_paper_results(query)[:max_results]

    results = []
    for p in papers:
        if not p.get("abstract"):
            continue
        results.append(
            SourceItem(
                source_type="paper",
                title=p.get("title", "Untitled"),
                url=p.get("url") or f"https://www.semanticscholar.org/paper/{p.get('paperId', '')}",
                summary=p["abstract"],
                metadata={
                    "year": p.get("year"),
                    "citation_count": p.get("citationCount", 0),
                    "provenance": "live",
                },
            )
        )
    return results or _mock_paper_results(query)[:max_results]


def search_papers_multi(queries: list[str], per_query: int = 3) -> list[SourceItem]:
    seen_urls: set[str] = set()
    combined: list[SourceItem] = []
    for q in queries:
        for item in search_papers(q, max_results=per_query)[:per_query]:
            if item.url not in seen_urls:
                seen_urls.add(item.url)
                combined.append(item)
    return combined

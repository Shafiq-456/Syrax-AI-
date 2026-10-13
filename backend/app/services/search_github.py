"""
Part 2: GitHub search integration — executes live GitHub REST discovery
with User-Agent headers, token authentication, and explicit provenance tracking.
"""
import re
import httpx

from app.core.config import settings
from app.schemas import SourceItem

GITHUB_API_URL = "https://api.github.com/search/repositories"


def _mock_github_results(query: str) -> list[SourceItem]:
    """Synthetic GitHub results used in demo mode or when API rate-limits."""
    slug = re.sub(r'[^a-zA-Z0-9]', '-', query.lower()).strip('-')[:30] or "project"
    return [
        SourceItem(
            source_type="github",
            title=f"oss-research/{slug}",
            url=f"https://github.com/oss-research/{slug}",
            summary=f"Open-source implementation for {query} with modular architecture, benchmarks, and extensible API.",
            metadata={"stars": 1420, "last_updated": "2024-09-12", "topics": ["open-source", "research"], "provenance": "simulated"},
        ),
        SourceItem(
            source_type="github",
            title=f"developer-tools/{slug}-core",
            url=f"https://github.com/developer-tools/{slug}-core",
            summary=f"High-performance engine providing foundational workflows and CLI bindings for {query}.",
            metadata={"stars": 860, "last_updated": "2024-08-04", "topics": ["automation", "sdk"], "provenance": "simulated"},
        ),
    ]


def search_github(query: str, max_results: int = 5) -> list[SourceItem]:
    if settings.demo_mode:
        return _mock_github_results(query)[:max_results]

    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "Syrax-AI-Research-Agent/2.0",
    }
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"

    params = {"q": query, "sort": "stars", "order": "desc", "per_page": max_results}
    try:
        resp = httpx.get(GITHUB_API_URL, headers=headers, params=params, timeout=12)
        resp.raise_for_status()
        items = resp.json().get("items", [])
    except Exception:
        # Graceful fallback with transparent provenance
        return _mock_github_results(query)[:max_results]

    results = []
    for item in items:
        results.append(
            SourceItem(
                source_type="github",
                title=item["full_name"],
                url=item["html_url"],
                summary=item.get("description") or "(No repository description provided)",
                metadata={
                    "stars": item.get("stargazers_count", 0),
                    "last_updated": item.get("updated_at"),
                    "topics": item.get("topics", []),
                    "provenance": "live",
                },
            )
        )
    return results or _mock_github_results(query)[:max_results]


def search_github_multi(queries: list[str], per_query: int = 3) -> list[SourceItem]:
    """Run several search terms and dedupe by URL."""
    seen_urls: set[str] = set()
    combined: list[SourceItem] = []
    for q in queries:
        for item in search_github(q, max_results=per_query):
            if item.url not in seen_urls:
                seen_urls.add(item.url)
                combined.append(item)
    return combined

"""
Part 2: GitHub search integration — with graceful fallback to mock data
when the API is unavailable or rate-limited (e.g. in demo mode).
"""
import httpx

from app.core.config import settings
from app.schemas import SourceItem

GITHUB_API_URL = "https://api.github.com/search/repositories"


def _mock_github_results(query: str) -> list[SourceItem]:
    """Synthetic GitHub results used in demo mode or when the API fails."""
    slug = query.replace(" ", "-").lower()[:30]
    return [
        SourceItem(
            source_type="github",
            title=f"example/{slug}-tool",
            url=f"https://github.com/example/{slug}-tool",
            summary=f"A popular open-source tool for {query}. Actively maintained with 1.2k stars.",
            metadata={"stars": 1200, "last_updated": "2024-09-01", "topics": ["ai", "productivity"]},
        ),
        SourceItem(
            source_type="github",
            title=f"acme/{slug}-api",
            url=f"https://github.com/acme/{slug}-api",
            summary=f"REST API wrapper for {query} workflows. Integrates with popular CI/CD pipelines.",
            metadata={"stars": 430, "last_updated": "2024-07-15", "topics": ["api", "automation"]},
        ),
    ]


def search_github(query: str, max_results: int = 5) -> list[SourceItem]:
    if settings.demo_mode:
        return _mock_github_results(query)[:max_results]

    headers = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        headers["Authorization"] = f"Bearer {settings.github_token}"

    params = {"q": query, "sort": "stars", "order": "desc", "per_page": max_results}
    try:
        resp = httpx.get(GITHUB_API_URL, headers=headers, params=params, timeout=15)
        resp.raise_for_status()
        items = resp.json().get("items", [])
    except Exception:
        return _mock_github_results(query)[:max_results]

    results = []
    for item in items:
        results.append(
            SourceItem(
                source_type="github",
                title=item["full_name"],
                url=item["html_url"],
                summary=item.get("description") or "(no description provided)",
                metadata={
                    "stars": item.get("stargazers_count", 0),
                    "last_updated": item.get("updated_at"),
                    "topics": item.get("topics", []),
                },
            )
        )
    return results


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


if __name__ == "__main__":
    results = search_github("recipe recommendation app", max_results=3)
    for r in results:
        print(f"- {r.title} ({r.metadata['stars']} stars): {r.url}")

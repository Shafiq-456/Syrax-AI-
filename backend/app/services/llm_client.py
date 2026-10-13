"""
Shared LLM client — wraps either Grok (xAI OpenAI-compatible API) or a
fast mock/demo mode so the full pipeline can be demonstrated without any
API keys.

Import and use `llm_chat(system, user_content)` in every service instead of
calling the Anthropic/OpenAI clients directly.
"""
import json
import random

from app.core.config import settings


def llm_chat(system: str, user_content: str, max_tokens: int = 1500) -> str:
    """
    Call the LLM and return the raw response text.

    In demo mode, returns a plausible JSON mock without any network call.
    When GROK_API_KEY is set and demo_mode=False, calls grok-3-mini via xAI.
    """
    if settings.demo_mode or not settings.grok_api_key:
        return _demo_response(system, user_content)

    from openai import OpenAI
    client = OpenAI(
        api_key=settings.grok_api_key,
        base_url="https://api.x.ai/v1",
    )
    response = client.chat.completions.create(
        model=settings.llm_model,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_content},
        ],
    )
    return response.choices[0].message.content.strip()


# ---------------------------------------------------------------------------
# Demo mode — returns realistic mock JSON based on keyword cues in the system prompt
# ---------------------------------------------------------------------------

_DEMO_DOMAINS = [
    "AI-powered productivity", "developer tooling", "healthcare tech",
    "education technology", "fintech / personal finance", "climate tech",
    "creator economy", "smart home / IoT", "e-commerce personalization",
]

_DEMO_STACKS = [
    ["Python (FastAPI) — fast async backend", "React + TypeScript — typed UI",
     "PostgreSQL — relational persistence", "Redis — job queue / caching",
     "Docker + Fly.io — simple zero-ops deployment"],
    ["Next.js — full-stack React framework with SSR", "Prisma — type-safe ORM",
     "Supabase — hosted Postgres + realtime subscriptions",
     "Vercel — edge deployment with zero config"],
    ["Node.js (Hono) — lightweight edge-ready API", "SvelteKit — compiler-first UI",
     "PlanetScale — serverless MySQL", "Cloudflare Workers — global edge compute"],
]

_DEMO_ROADMAPS = [
    ["MVP: core feature with manual onboarding, 10 beta users",
     "v1: automated onboarding, payments, basic analytics dashboard",
     "v2: API for third-party integrations, mobile app, enterprise SSO"],
    ["MVP: CLI tool with local storage and basic auth",
     "v1: web UI, team workspaces, export to common formats",
     "v2: real-time collaboration, plugin marketplace, SLA-backed hosting"],
]


def _demo_response(system: str, content: str) -> str:
    """
    Heuristically return a mock JSON response that matches the expected
    schema for each service, keyed on UNIQUE strings in each system prompt.
    Routing order matters — more specific checks first.
    """
    s = system.lower()

    # 1. Idea analysis — unique marker: "problem_domain" in schema example
    if "problem_domain" in s:
        domain = random.choice(_DEMO_DOMAINS)
        words = content.split()[:6]
        return json.dumps({
            "problem_domain": domain,
            "target_user": "developers and early-stage startup teams",
            "core_technical_approach": (
                "Combines retrieval-augmented generation (RAG) with a structured "
                "scoring engine to surface overlap with existing work and pinpoint "
                "uncharted differentiation opportunities."
            ),
            "claimed_differentiators": [
                "Real-time novelty scoring against live GitHub repos",
                "LLM-grounded gap detection (not free-form hallucination)",
                "Versioned iteration loop for refining ideas",
            ],
            "key_search_terms": [
                " ".join(words[:3]) if len(words) >= 3 else "AI idea validator",
                "project novelty scoring tool",
                "startup idea validation AI",
                "RAG-based competitor analysis",
            ],
        })

    # 2. Similarity judge — unique marker: "0 = completely unrelated problems"
    if "0 = completely unrelated" in s:
        import re
        lower = content.lower()
        idea_part, existing_part = "", ""
        if "existing work:" in lower:
            parts = lower.split("existing work:")
            idea_part = parts[0].replace("idea:", "").strip()
            existing_part = parts[1].strip()
        else:
            idea_part, existing_part = lower, lower

        stop_words = {
            "a", "an", "the", "in", "on", "of", "for", "to", "with", "and", "or", "is", "are",
            "it", "this", "that", "from", "by", "as", "at", "be", "your", "using", "app", "tool",
            "system", "platform", "based", "real", "time"
        }
        def get_kw(text: str) -> set[str]:
            words = re.findall(r'[a-zA-Z0-9]+', text.lower())
            return {w for w in words if w not in stop_words and len(w) > 2}

        idea_kw = get_kw(idea_part)
        exist_kw = get_kw(existing_part)
        shared = idea_kw & exist_kw

        # Direct high-overlap brand or functional concept pairings
        high_overlap_pairs = [
            ("instagram", "photo"), ("instagram", "instagram"),
            ("twitter", "post"), ("twitter", "twitter"), ("timeline", "social"),
            ("recipe", "recipes"), ("fridge", "fridge"),
            ("ride", "driver"), ("rider", "drivers"), ("uber", "uber"), ("sharing", "rides"),
            ("markdown", "notes"), ("notion", "notion"), ("folder", "notes")
        ]
        is_clone = False
        for p1, p2 in high_overlap_pairs:
            if (p1 in idea_part and p2 in existing_part) or (p2 in idea_part and p1 in existing_part):
                is_clone = True
                break

        # Highly differentiated specialized domains
        diff_clues = [
            "microtonal", "soil-moisture", "drought", "crop yield", "lab equipment",
            "scientific lab", "sign language", "factory-floor", "coffee", "roasting"
        ]
        is_differentiated = any(d in idea_part and d not in existing_part for d in diff_clues)

        if is_clone or len(shared) >= 3:
            score = 0.85
            reasoning = "Substantial overlap: the proposed concept targets the exact core problem and workflows solved by this existing solution."
        elif is_differentiated:
            score = 0.15
            reasoning = "Low overlap: the user concept features highly specialized domain constraints not addressed by the broader existing work."
        else:
            jaccard = len(shared) / (len(idea_kw | exist_kw) or 1)
            score = round(min(0.85, max(0.18, 0.25 + jaccard * 0.8)), 3)
            reasoning = "Moderate conceptual overlap: shares foundational technical components with divergent application objectives."

        return json.dumps({"score": score, "reasoning": reasoning})

    # 3. Gaps — unique marker: "innovation gaps:" (the colon distinguishes from rec prompt)
    if "innovation gaps:" in s:
        import re
        urls = re.findall(r'https?://[^\s\]\)\,\"]+', content)
        sample_url_1 = urls[0] if len(urls) > 0 else "https://github.com/syrax/reference-repo"
        sample_url_2 = urls[1] if len(urls) > 1 else sample_url_1
        sample_url_3 = urls[2] if len(urls) > 2 else sample_url_1

        return json.dumps([
            {
                "description": "Offline-first edge execution and localized data processing",
                "evidence_sources": [sample_url_1],
                "why_it_matters": "Enables air-gapped security and sub-millisecond local response without cloud dependencies.",
            },
            {
                "description": "Automated CI/CD integration and developer workflow hooks",
                "evidence_sources": [sample_url_2],
                "why_it_matters": "Prevents redundant iterations and validates specifications directly in pull requests.",
            },
            {
                "description": "Multi-modal input support for architectural schematics and diagrams",
                "evidence_sources": [sample_url_3],
                "why_it_matters": "Enables engineers to validate visual system designs alongside textual project prompts.",
            },
        ])

    # 4. Recommendations — unique marker: "critical rule: every recommendation"
    if "critical rule" in s:
        import re
        urls = re.findall(r'https?://[^\s\]\)\,\"]+', content)
        sample_url_1 = urls[0] if len(urls) > 0 else "https://github.com/syrax/reference-repo"
        sample_url_2 = urls[1] if len(urls) > 1 else sample_url_1
        sample_url_3 = urls[2] if len(urls) > 2 else sample_url_1

        return json.dumps([
            {
                "suggestion": "Implement an offline-first local cache to ensure rapid response times and compliance in restricted environments.",
                "cited_sources": [sample_url_1],
                "related_gap": "Offline-first edge execution and localized data processing",
            },
            {
                "suggestion": "Expose a GitHub Action / pre-commit hook to continuously validate ideas directly in existing developer toolchains.",
                "cited_sources": [sample_url_2],
                "related_gap": "Automated CI/CD integration and developer workflow hooks",
            },
            {
                "suggestion": "Add support for parsing architecture diagrams and wireframe images as complementary inputs to text prompts.",
                "cited_sources": [sample_url_3],
                "related_gap": "Multi-modal input support for architectural schematics and diagrams",
            },
        ])

    # 5. Architecture — unique marker: "mvp ->"
    if "mvp ->" in s or "roadmap" in s:
        stack = random.choice(_DEMO_STACKS)
        roadmap = random.choice(_DEMO_ROADMAPS)
        return json.dumps({
            "stack": stack,
            "key_components": [
                "Idea ingestion & structured extraction service",
                "Multi-source search aggregator (GitHub + Papers)",
                "Embedding & vector store (RAG layer)",
                "Novelty scoring engine (cosine + LLM judge)",
                "Gap & recommendation generator",
                "Report assembler & export (Markdown / PDF)",
                "Versioned iteration database (SQLite -> Postgres in prod)",
            ],
            "roadmap": roadmap,
        })

    # Fallback
    return json.dumps({"result": "demo response", "input_preview": content[:100]})

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
        score = round(random.uniform(0.1, 0.7), 3)
        return json.dumps({
            "score": score,
            "reasoning": (
                "The two projects target a similar user persona and rely on "
                "comparable retrieval techniques, but differ in scope and "
                "intended deployment environment."
            ),
        })

    # 3. Gaps — unique marker: "innovation gaps:" (the colon distinguishes from rec prompt)
    if "innovation gaps:" in s:
        return json.dumps([
            {
                "description": "Offline / air-gapped operation",
                "evidence_sources": ["https://github.com/example/similar-tool"],
                "why_it_matters": "Many enterprise teams cannot share code with external APIs.",
            },
            {
                "description": "Integration with CI/CD pipelines",
                "evidence_sources": ["https://github.com/example/ci-validator"],
                "why_it_matters": "Automating novelty checks on PRs prevents duplicate work.",
            },
            {
                "description": "Multi-modal input (diagrams, wireframes)",
                "evidence_sources": ["https://arxiv.org/abs/2310.00001"],
                "why_it_matters": "Visual artifacts convey design intent that text descriptions miss.",
            },
        ])

    # 4. Recommendations — unique marker: "critical rule: every recommendation"
    if "critical rule" in s:
        return json.dumps([
            {
                "suggestion": "Add a 'prior art timeline' view that plots existing solutions chronologically so users see the evolution of the space, not just point-in-time overlap.",
                "cited_sources": ["https://github.com/example/similar-tool"],
                "related_gap": "Offline / air-gapped operation",
            },
            {
                "suggestion": "Expose a GitHub Action so teams can validate ideas as part of their PR workflow — no manual step required.",
                "cited_sources": ["https://github.com/example/ci-validator"],
                "related_gap": "Integration with CI/CD pipelines",
            },
            {
                "suggestion": "Accept image/diagram uploads (wireframes, architecture diagrams) as supplementary input alongside free text to improve analysis accuracy.",
                "cited_sources": ["https://arxiv.org/abs/2310.00001"],
                "related_gap": "Multi-modal input (diagrams, wireframes)",
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

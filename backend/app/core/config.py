"""
Central app configuration. Every module imports `settings` from here
rather than reading os.environ directly.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "Syrax"
    environment: str = "development"
    debug: bool = True

    # Database
    database_url: str = "sqlite:///./syrax.db"

    # Part 2: GitHub
    github_token: str | None = None

    # Part 3/5/7/8: LLM (Grok via xAI — OpenAI-compatible API)
    grok_api_key: str | None = None
    llm_model: str = "grok-3-mini"

    # Demo/mock mode — runs the full pipeline with synthetic data, no API keys needed
    demo_mode: bool = True

    # Part 4: RAG
    chroma_persist_dir: str = "./chroma_db"
    embedding_model: str = "all-MiniLM-L6-v2"


settings = Settings()

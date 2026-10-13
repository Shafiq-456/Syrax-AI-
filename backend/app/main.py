"""
Syrax backend entrypoint — Part 1 goal: run this and confirm it responds.

Run with:
    uvicorn app.main:app --reload

Then open http://127.0.0.1:8000/docs to see the interactive API docs,
and http://127.0.0.1:8000/health to confirm the server + DB are alive.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import Base, engine
from app import models  # noqa: F401 — import so models register with Base
from app.api.routes import router as api_router

# Creates tables from app/models if they don't exist yet.
Base.metadata.create_all(bind=engine)

def _ensure_sqlite_columns():
    """Ensure newly added columns exist in SQLite without dropping tables."""
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            cols_ideas = [r[1] for r in conn.execute(text("PRAGMA table_info(ideas)"))]
            if "workspace_id" not in cols_ideas:
                conn.execute(text("ALTER TABLE ideas ADD COLUMN workspace_id INTEGER"))
            if "user_id" not in cols_ideas:
                conn.execute(text("ALTER TABLE ideas ADD COLUMN user_id INTEGER"))

            cols_rv = [r[1] for r in conn.execute(text("PRAGMA table_info(report_versions)"))]
            if "status" not in cols_rv:
                conn.execute(text("ALTER TABLE report_versions ADD COLUMN status VARCHAR(50) DEFAULT 'completed'"))

            cols_src = [r[1] for r in conn.execute(text("PRAGMA table_info(sources)"))]
            if "provenance" not in cols_src:
                conn.execute(text("ALTER TABLE sources ADD COLUMN provenance VARCHAR(50) DEFAULT 'live'"))
            conn.commit()
    except Exception as e:
        print(f"Schema check notice: {e}")

_ensure_sqlite_columns()

app = FastAPI(title=settings.app_name)

# Allow the local React dev server to call this API during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": f"{settings.app_name} backend is running"}


@app.get("/health")
def health():
    return {"status": "ok", "environment": settings.environment}


app.include_router(api_router, prefix="/api", tags=["syrax"])

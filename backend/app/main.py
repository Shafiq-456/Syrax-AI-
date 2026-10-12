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
# Fine for SQLite + early development; swap for Alembic migrations later.
Base.metadata.create_all(bind=engine)

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

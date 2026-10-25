# Syrax AI — AI Project Intelligence & Research Validation Platform

> *"Discover what already exists. Understand what is missing. Build what matters."*  
> **From raw ideas to research-backed innovation.**

---

## ⚡ Overview

**Syrax AI** is a state-of-the-art AI-powered platform designed for developers, researchers, students, and founders to investigate, validate, and substantiate project ideas before writing code. 

By autonomously searching public **GitHub repositories**, **Semantic Scholar academic papers**, and developer tools, Syrax identifies prior art, measures mathematically grounded novelty scores, highlights verified innovation gaps, recommends tailored tech stacks, and produces actionable implementation roadmaps.

---

## 💎 Key Features & Architecture

- **Interactive 3D Neural Hero**: Custom Three.js polyhedral crystalline intelligence core with orbiting particle rings, pulsating constellation nodes, and mouse-driven parallax.
- **Structured Research Intake**: Flexible input console with real-time character counting, pre-curated domain chips, and expandable specification parameters (Domain, Target Audience, Technical Constraints).
- **Live 8-Stage SSE Pipeline Workspace**: Real-time streaming stepper tracking each validation stage:
  1. `idea_analysis`: Problem domain & query vector extraction.
  2. `search`: Parallel multi-query discovery across GitHub & Semantic Scholar.
  3. `rag`: ChromaDB vector store ingestion with `all-MiniLM-L6-v2` dense embeddings.
  4. `similarity`: Composite cosine novelty scoring and overlap ranking.
  5. `gaps`: Grounded technical boundaries and unmet user requirements.
  6. `recommendations`: Actionable solutions linked to source citations.
  7. `architecture`: Tech stack recommendation and phased milestone roadmap.
  8. `report`: Dossier compilation with immutable versioning.
- **Interactive Research Knowledge Graph**: SVG/Canvas relationship network mapping the central idea to discovered GitHub repos, research papers, and recommended tech components.
- **Dedicated Research Explorer**: Live search & filter catalog of all indexed GitHub repositories and academic arXiv papers with star counts, citations, and direct external links.
- **Versioned Dossier Revision Loop**: Iterate on ideas with revision prompts; compare version histories and observe changes in novelty scores.
- **System Telemetry & Health Diagnostics**: Real-time backend ping latency monitor, inference engine status (`grok-3-mini`), and pipeline architecture visualizer.

---

## 📁 Repository Structure

```
syrax/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI application entrypoint with CORS & routes
│   │   ├── schemas.py                 # Pydantic v2 validation contracts across all stages
│   │   ├── core/config.py             # Settings, environment variables, demo mode toggle
│   │   ├── db/session.py              # SQLite + SQLAlchemy ORM session factory
│   │   ├── models/__init__.py         # Idea, ReportVersion, Source relational tables
│   │   ├── api/
│   │   │   └── routes.py              # REST & SSE endpoints (/stats, /ideas, /sources, /stream)
│   │   └── services/
│   │       ├── idea_analysis.py       # LLM structured extraction (Domain, Audience, Tech)
│   │       ├── search_github.py       # GitHub REST API discovery
│   │       ├── search_papers.py       # Semantic Scholar / arXiv paper discovery
│   │       ├── rag.py                 # ChromaDB vector embedding & RAG context builder
│   │       ├── similarity.py          # Grounded novelty scorer & cosine similarity
│   │       ├── gaps.py                # Innovation gap auditor
│   │       ├── recommendations.py     # Cited recommendations tied to source URLs
│   │       ├── architecture.py        # Tech stack diagram & phased roadmap generator
│   │       ├── report.py              # Dossier compilation & Markdown/PDF export
│   │       └── orchestrator.py        # Multi-stage execution pipeline yielding SSE events
│   ├── tests/
│   │   └── test_similarity.py         # Novelty scoring validation test suite
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── main.tsx                   # React root mount
    │   ├── App.tsx                    # Master navigation router & workspace state
    │   ├── api.ts                     # TypeScript API client & SSE streaming reader
    │   ├── index.css                  # Master design system (Glassmorphism, Cyan/Violet tokens)
    │   ├── components/
    │   │   ├── AppShell.tsx           # Persistent sidebar navigation & responsive header
    │   │   ├── Hero3DVisualizer.tsx   # Three.js 3D intelligence core with mouse parallax
    │   │   ├── IdeaIntake.tsx         # Research intake input with example chips
    │   │   ├── PipelineWorkspace.tsx  # Live 8-stage progress tracker with timer & gauge
    │   │   ├── ReportViewEnhanced.tsx # Multi-tab intelligence dossier
    │   │   ├── ResearchNetworkGraph.tsx # Interactive SVG research network graph
    │   │   └── VersionHistory.tsx     # Version selector & revision loop
    │   └── pages/
    │       ├── DashboardPage.tsx      # Real stats & recent project runs
    │       ├── NewAnalysisPage.tsx    # 3D Hero + Idea Intake screen
    │       ├── ResearchExplorerPage.tsx # GitHub & Paper search & filter explorer
    │       ├── ReportsPage.tsx        # Saved reports archive
    │       └── SettingsPage.tsx       # Live health check, ping latency, & pipeline diagram
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    └── tsconfig.json
```

---

## 🚀 Quickstart Guide:

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+** & npm

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```
*(By default, `DEMO_MODE=true` runs self-contained without requiring paid API keys).*

Start the FastAPI backend:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` to launch the platform.

### 4. Production Build
```bash
cd frontend
npm run build
```

---

## 🛡️ License & Acknowledgments
Built with ❤️ for innovators, developers, and researchers everywhere.

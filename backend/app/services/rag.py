"""
Part 4: RAG pipeline — embeds retrieved sources and stores them in Chroma,
so later stages can retrieve relevant chunks instead of dumping everything
into the LLM's context.

In demo mode (no API keys) this module uses simple in-memory storage with
bag-of-words similarity so the full pipeline can run without heavy ML deps.
When sentence-transformers and chromadb are installed it uses real embeddings.
"""
import hashlib
import math
from app.core.config import settings
from app.schemas import SourceItem

# In-memory fallback store: {report_version_id: [{id, doc, metadata}]}
_memory_store: dict[int, list[dict]] = {}

# ---------- Optional heavy dependencies ----------
_USE_REAL_EMBEDDINGS = False

def _try_load_heavy():
    global _USE_REAL_EMBEDDINGS, _model, _chroma_client
    if settings.demo_mode:
        return
    try:
        import chromadb
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(settings.embedding_model)
        _chroma_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        _USE_REAL_EMBEDDINGS = True
    except ImportError:
        pass

_model = None
_chroma_client = None
_try_load_heavy()


# ---------- Public API ----------

def embed_text(text: str) -> list[float]:
    if _USE_REAL_EMBEDDINGS and _model is not None:
        return _model.encode(text).tolist()
    # Lightweight BoW pseudo-embedding (unit vector over word frequencies)
    freq: dict = {}
    for w in text.lower().split():
        freq[w] = freq.get(w, 0) + 1
    norm = math.sqrt(sum(v ** 2 for v in freq.values())) or 1e-9
    # Return as a stable-ish float list (sorted keys for determinism)
    return [freq[k] / norm for k in sorted(freq)]


def ingest_sources(report_version_id: int, sources: list[SourceItem]) -> None:
    if _USE_REAL_EMBEDDINGS and _chroma_client is not None:
        _ingest_chroma(report_version_id, sources)
        return
    # In-memory fallback
    store = _memory_store.setdefault(report_version_id, [])
    for src in sources:
        doc_text = f"{src.title}\n\n{src.summary}"
        doc_id = hashlib.md5(src.url.encode()).hexdigest()
        # Avoid duplicates
        if not any(d["id"] == doc_id for d in store):
            store.append({
                "id": doc_id,
                "doc": doc_text,
                "metadata": {"url": src.url, "source_type": src.source_type, "title": src.title},
            })


def retrieve_relevant(report_version_id: int, query: str, top_k: int = 5) -> list[dict]:
    if _USE_REAL_EMBEDDINGS and _chroma_client is not None:
        return _retrieve_chroma(report_version_id, query, top_k)

    store = _memory_store.get(report_version_id, [])
    query_words = set(query.lower().split())
    scored = []
    for item in store:
        doc_words = set(item["doc"].lower().split())
        overlap = len(query_words & doc_words) / (len(query_words | doc_words) or 1)
        scored.append((overlap, item))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [{"text": item["doc"], "metadata": item["metadata"], "distance": 1 - sc}
            for sc, item in scored[:top_k]]


# ---------- Chroma helpers (only called when USE_REAL_EMBEDDINGS is True) ----------

def _ingest_chroma(report_version_id: int, sources: list[SourceItem]) -> None:
    collection_name = f"report_{report_version_id}"
    collection = _chroma_client.get_or_create_collection(collection_name)
    ids, documents, metadatas, embeddings = [], [], [], []
    for src in sources:
        doc_text = f"{src.title}\n\n{src.summary}"
        doc_id = hashlib.md5(src.url.encode()).hexdigest()
        ids.append(doc_id)
        documents.append(doc_text)
        metadatas.append({"url": src.url, "source_type": src.source_type, "title": src.title})
        embeddings.append(embed_text(doc_text))
    if ids:
        collection.upsert(ids=ids, documents=documents, metadatas=metadatas, embeddings=embeddings)


def _retrieve_chroma(report_version_id: int, query: str, top_k: int) -> list[dict]:
    collection_name = f"report_{report_version_id}"
    collection = _chroma_client.get_or_create_collection(collection_name)
    query_embedding = embed_text(query)
    results = collection.query(query_embeddings=[query_embedding], n_results=top_k)
    return [
        {"text": doc, "metadata": meta, "distance": dist}
        for doc, meta, dist in zip(
            results["documents"][0], results["metadatas"][0], results["distances"][0]
        )
    ]

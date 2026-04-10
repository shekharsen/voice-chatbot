"""
retrieval.py
------------
Handles all ChromaDB vector search (the RAG "R" — Retrieval).

How RAG retrieval works:
  1. User asks: "What is the return policy?"
  2. The question is embedded using nomic-embed-text → a vector (list of floats)
  3. ChromaDB compares that vector against all stored chunk vectors
  4. The top-k most similar chunks are returned (cosine / L2 similarity)
  5. Those chunks become the "context" injected into the Ollama LLM prompt
  6. The LLM answers ONLY from that context — grounded, no hallucination

The ChromaDB instance is loaded once (singleton) and reused
across all incoming requests for efficiency.
"""

from pathlib import Path
from config import settings

# Lazy-loaded singleton — initialised on first query, reused after
_vectordb = None


def get_vectordb():
    """
    Return the ChromaDB vector store, loading it if not yet initialised.
    Uses a module-level singleton to avoid reloading the DB on every request.
    """
    global _vectordb

    if _vectordb is None:
        from langchain_community.vectorstores import Chroma
        from langchain_community.embeddings import OllamaEmbeddings

        embeddings = OllamaEmbeddings(
            model=settings.EMBED_MODEL,
            base_url=settings.OLLAMA_BASE_URL,
        )

        _vectordb = Chroma(
            persist_directory=settings.CHROMA_DIR,
            embedding_function=embeddings,
            collection_name="voice_rag",
        )

    return _vectordb


def retrieve_context(question: str, k: int = None) -> tuple[str, list[str]]:
    """
    Search ChromaDB for the top-k document chunks most relevant to `question`.

    Args:
        question : The user's natural language query.
        k        : Number of chunks to retrieve (default from settings).

    Returns:
        context  : str        — chunks joined with separators, ready to inject
                                into the LLM prompt.
        sources  : list[str]  — unique source filenames for citation display
                                in the frontend.

    Notes:
        • similarity_search_with_score returns (Document, L2_distance) pairs.
        • Lower L2 distance = more similar = better match.
        • Chunks above the similarity threshold are filtered out to avoid
          injecting irrelevant context that confuses the LLM.
        • If nothing passes the threshold, the raw top-2 are used as fallback
          so the LLM always has something to work with.
    """
    if k is None:
        k = settings.RETRIEVAL_K

    try:
        db      = get_vectordb()
        results = db.similarity_search_with_score(question, k=k)

        if not results:
            return "", []

        context_parts: list[str] = []
        sources:       list[str] = []

        for doc, score in results:
            if score < settings.SIMILARITY_THRESHOLD:
                context_parts.append(doc.page_content.strip())
                src = doc.metadata.get("source", "document")
                if src not in sources:
                    sources.append(src)

        # Fallback: nothing passed the threshold — use top-2 regardless
        if not context_parts:
            for doc, _ in results[:2]:
                context_parts.append(doc.page_content.strip())
                src = doc.metadata.get("source", "document")
                if src not in sources:
                    sources.append(src)

        # Join chunks with a clear separator so the LLM sees them as distinct
        context = "\n\n---\n\n".join(context_parts)
        return context, sources

    except Exception as exc:
        print(f"[WARN] retrieval.retrieve_context error: {exc}")
        return "", []


def is_kb_ready() -> bool:
    """
    Return True if the ChromaDB folder exists and has been populated.
    Called by the /health endpoint and before every chat request.
    """
    p = Path(settings.CHROMA_DIR)
    return p.exists() and any(p.iterdir())


def reset_vectordb():
    """
    Force-reload the ChromaDB singleton on the next query.
    Call this after re-running ingest.py without restarting the server.
    """
    global _vectordb
    _vectordb = None

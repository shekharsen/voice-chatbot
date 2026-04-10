"""
config.py
---------
Single source of truth for all application settings.
Every other module imports from here — never reads .env directly.

Usage:
    from config import settings
    print(settings.LLM_MODEL)
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """
    Reads all environment variables once at startup.
    Provides typed, named attributes used across the app.
    """

    # ── Ollama ────────────────────────────────────────────────────────────
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    LLM_MODEL:       str = os.getenv("LLM_MODEL",       "phi3:mini")
    EMBED_MODEL:     str = os.getenv("EMBED_MODEL",      "nomic-embed-text")

    # ── Storage paths ──────────────────────────────────────────────────────
    CHROMA_DIR: str = os.getenv("CHROMA_DIR", "./chroma_db")
    DOCS_DIR:   str = os.getenv("DOCS_DIR",   "./docs")

    # ── Session config ─────────────────────────────────────────────────────
    MAX_TURNS: int = int(os.getenv("MAX_TURNS", "10"))

    # ── CORS ───────────────────────────────────────────────────────────────
    ALLOWED_ORIGIN: str = os.getenv("ALLOWED_ORIGIN", "*")

    # ── RAG retrieval ──────────────────────────────────────────────────────
    RETRIEVAL_K:         int   = 4      # top-k chunks returned per query
    SIMILARITY_THRESHOLD: float = 1.8   # L2 distance cutoff (lower = stricter)

    # ── LLM generation ─────────────────────────────────────────────────────
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS:  int   = 250        # short = faster voice responses

    def __repr__(self):
        return (
            f"Settings(model={self.LLM_MODEL}, "
            f"embed={self.EMBED_MODEL}, "
            f"chroma={self.CHROMA_DIR})"
        )


# Single shared instance — import this everywhere
settings = Settings()

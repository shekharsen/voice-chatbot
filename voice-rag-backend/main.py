"""
main.py
-------
FastAPI application entry point.

API Endpoints:
  GET  /           → serves a simple status page
  GET  /health     → system status (used by React frontend status badge)
  POST /chat       → main chat endpoint (RAG + Ollama LLM)
  DELETE /session/{id}  → clear conversation history for a session
  GET  /sessions   → admin: list active sessions

Architecture:
  main.py
  ├── schemas.py        — Pydantic request/response models
  ├── config.py         — settings from .env
  ├── retrieval.py      — ChromaDB RAG search
  ├── prompt_builder.py — assembles the LLM prompt
  ├── llm_client.py     — calls Ollama
  └── session_store.py  — in-memory conversation history

Run:
  uvicorn main:app --reload --port 8000

Prerequisites (must be running before starting):
  1. ollama serve
  2. python ingest.py   (run once to build the knowledge base)
"""

import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config         import settings
from app.schemas        import ChatRequest, ChatResponse, HealthResponse, SessionDeleteResponse
from app.retrieval      import retrieve_context, is_kb_ready
from app.prompt_builder import build_prompt
from app.llm_client     import generate
from app.session_store  import (
    get_history,
    append_messages,
    delete_session,
    list_sessions,
)


# ── App initialisation ────────────────────────────────────────────────────────

app = FastAPI(
    title       = "Voice RAG Assistant API",
    description = "FastAPI backend for a voice chatbot using Ollama + ChromaDB. 100% free.",
    version     = "1.0.0",
    docs_url    = "/docs",    # Swagger UI at http://localhost:8000/docs
    redoc_url   = "/redoc",   # ReDoc UI  at http://localhost:8000/redoc
)

# ── CORS middleware ───────────────────────────────────────────────────────────
# Allows the React dev server (localhost:3000) to call this API.
# In production, replace "*" with your frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["General"])
async def root():
    """
    Root endpoint — quick sanity check that the server is up.
    The React frontend uses /health (not this) for status checking.
    """
    return {
        "message": "Voice RAG Assistant API is running.",
        "docs":    "http://localhost:8000/docs",
        "health":  "http://localhost:8000/health",
    }


@app.get("/health", response_model=HealthResponse, tags=["General"])
async def health_check():
    """
    Health check endpoint polled by the React frontend on page load.

    Returns:
        status          : Always "ok" if the server is running.
        llm_model       : Which Ollama model is being used.
        embed_model     : Which embedding model is being used.
        kb_ready        : True if ChromaDB has been populated via ingest.py.
        ollama_url      : The Ollama server URL from settings.
        active_sessions : How many chat sessions are currently in memory.
    """
    sessions_info = list_sessions()

    return HealthResponse(
        status          = "ok",
        llm_model       = settings.LLM_MODEL,
        embed_model     = settings.EMBED_MODEL,
        kb_ready        = is_kb_ready(),
        ollama_url      = settings.OLLAMA_BASE_URL,
        active_sessions = sessions_info["active_sessions"],
    )


@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(req: ChatRequest):
    """
    Main chat endpoint — the core of the application.

    Full request flow:
      1.  Validate request (Pydantic — automatic)
      2.  Resolve session ID (reuse existing or create new UUID)
      3.  RAG retrieval — embed question → search ChromaDB → get top-k chunks
      4.  Load conversation history for this session
      5.  Build LLM prompt: system + context + history + question
      6.  Call Ollama LLM → generate answer
      7.  Save user + assistant messages to session history
      8.  Return answer + source filenames + session ID

    Args:
        req : ChatRequest body with `message` and optional `session_id`.

    Returns:
        ChatResponse with `reply`, `session_id`, `sources`, `kb_used`.

    Raises:
        400 : Empty message.
        503 : Ollama not running or model not found.
    """

    # ── Step 1: Validate message ──────────────────────────────────────────
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # ── Step 2: Resolve session ───────────────────────────────────────────
    # If no session_id provided (first message), generate a new UUID.
    # The client stores this and sends it back on all future requests.
    session_id = req.session_id or str(uuid.uuid4())

    # ── Step 3: RAG retrieval ─────────────────────────────────────────────
    # Embed the question and search ChromaDB for relevant document chunks.
    # Returns empty strings if the knowledge base hasn't been built yet.
    context, sources = "", []
    kb_used = False

    if is_kb_ready():
        context, sources = retrieve_context(req.message)
        kb_used = bool(context)
    else:
        print(f"[WARN] /chat: Knowledge base not ready — answering without RAG context.")

    # ── Step 4: Load conversation history ────────────────────────────────
    history = get_history(session_id)

    # ── Step 5: Build prompt ──────────────────────────────────────────────
    # Assembles: SYSTEM + CONTEXT + HISTORY + current question
    prompt = build_prompt(
        question = req.message,
        context  = context,
        history  = history,
    )

    # ── Step 6: Call Ollama LLM ───────────────────────────────────────────
    try:
        reply = generate(prompt)

    except ConnectionError as exc:
        # Ollama server not running
        raise HTTPException(status_code=503, detail=str(exc))

    except RuntimeError as exc:
        # Model not found or other LLM error
        raise HTTPException(status_code=503, detail=str(exc))

    # ── Step 7: Save to session history ──────────────────────────────────
    append_messages(
        session_id      = session_id,
        user_message    = req.message,
        assistant_reply = reply,
    )

    # ── Step 8: Return response ───────────────────────────────────────────
    return ChatResponse(
        reply      = reply,
        session_id = session_id,
        sources    = sources,
        kb_used    = kb_used,
    )


@app.delete("/session/{session_id}", response_model=SessionDeleteResponse, tags=["Sessions"])
async def clear_session(session_id: str):
    """
    Delete the conversation history for a given session.
    Called by the React frontend when the user clicks "New conversation".

    Args:
        session_id : The UUID of the session to clear.

    Returns:
        status : "cleared" if the session existed, "not_found" otherwise.
    """
    existed = delete_session(session_id)
    return SessionDeleteResponse(
        status     = "cleared" if existed else "not_found",
        session_id = session_id,
    )


@app.get("/sessions", tags=["Sessions"])
async def get_sessions():
    """
    Admin endpoint — returns info about all active sessions.
    Useful for debugging during development.
    """
    return list_sessions()


@app.post("/reload-kb", tags=["Admin"])
async def reload_knowledge_base():
    """
    Force the ChromaDB and LLM singletons to reload on the next request.
    Call this after running ingest.py without restarting the server.
    """
    from app.retrieval  import reset_vectordb
    from app.llm_client import reset_llm

    reset_vectordb()
    reset_llm()

    return {
        "status":  "reloaded",
        "kb_ready": is_kb_ready(),
    }
